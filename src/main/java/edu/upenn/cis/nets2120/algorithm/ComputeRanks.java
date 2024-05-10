package edu.upenn.cis.nets2120.algorithm;

import java.io.IOException;
import java.io.FileWriter;
import java.io.Serializable;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.DatabaseMetaData;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaDoubleRDD;


import edu.upenn.cis.nets2120.configu.Config;
import com.google.common.collect.Iterables;

import scala.Tuple2;

import java.util.*;
import java.lang.Math;

public class ComputeRanks extends SparkJob<List<Tuple2<String, Double>>> {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 1000;
    JavaPairRDD<String, Tuple2<String, Double>> users;
    JavaPairRDD<String, Double> labels; // users
    int MAX_ITERATIONS = 15;

    public ComputeRanks(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Fetch the social network from mysql using a JDBC connection, and create an edge graph with following four types of connections
     * (u, h) and (h, u), if user u has selected hashtag h as an interest
        (h, p) and (p, h), if post p is associated with hashtag h
        (u, p) and (p, u), if user u has “liked” post p
        (u1, u2) and (u2, u1) if users u1 and u2 are friends
     *
     * @return JavaPairRDD: The social network
     */
    public JavaPairRDD<String, Tuple2<String, Double>> getSocialNetworkFromJDBC() {
        List<Tuple2<String, String>> hashtagEdges = new ArrayList<>(); //(h, *) -> 1
        List<Tuple2<String, String>> userHashtagEdges = new ArrayList<>(); // (u,h) -> 0.3
        List<Tuple2<String, String>> postEdges = new ArrayList<>(); //(p, *) -> 1
        List<Tuple2<String, String>> userPostEdges = new ArrayList<>(); // (u,p) -> 0.4
        List<Tuple2<String, String>> userEdges = new ArrayList<>(); // (u,u') -> 0.3

        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD)) {
            // Query for user-hashtag relationships
            try (ResultSet rsUserHashtags = connection.createStatement().executeQuery(
                    "SELECT u.user_id, h.hashtag_id FROM hashtag_by hb " +
                    "JOIN users u ON hb.user_id = u.user_id " +
                    "JOIN hashtags h ON hb.hashtag_id = h.hashtag_id")) {
                while (rsUserHashtags.next()) {
                    String userId = "u" + rsUserHashtags.getString("user_id");
                    String hashtagId = rsUserHashtags.getString("hashtag_id");
                    userHashtagEdges.add(new Tuple2<>(userId, hashtagId));
                    hashtagEdges.add(new Tuple2<>(hashtagId, userId));
                }
            }

            // Query for post-hashtag relationships
            try (ResultSet rsPostHashtags = connection.createStatement().executeQuery(
                    "SELECT p.post_id, h.hashtag_id FROM post_tagged_with pth " +
                    "JOIN posts p ON pth.post_id = p.post_id " +
                    "JOIN hashtags h ON pth.hashtag_id = h.hashtag_id" )) { // "WHERE p.timestamp = CURRENT_DATE"
                while (rsPostHashtags.next()) {
                    String postId = "p" + rsPostHashtags.getString("post_id");
                    String hashtagId = rsPostHashtags.getString("hashtag_id");
                    postEdges.add(new Tuple2<>(postId, hashtagId));
                    hashtagEdges.add(new Tuple2<>(hashtagId, postId));
                }
            }

            // Query for user-post "like" relationships
            try (ResultSet rsLikes = connection.createStatement().executeQuery(
                    "SELECT pl.liker_id, p.post_id FROM posts_liked_by pl " +
                    "JOIN posts p ON pl.post_id = p.post_id")) { // "WHERE p.timestamp = CURRENT_DATE"
                while (rsLikes.next()) {
                    String userId = "u" + rsLikes.getString("liker_id");
                    String postId = "p" + rsLikes.getString("post_id");
                    userPostEdges.add(new Tuple2<>(userId, postId));
                    postEdges.add(new Tuple2<>(postId, userId));
                }
            }

            // Query for user friendships
            try (ResultSet rsFriends = connection.createStatement().executeQuery(
                    "SELECT f.follower, f.followed FROM friends f")) {
                while (rsFriends.next()) {
                    String follower = "u" + rsFriends.getString("follower");
                    String followed = "u" + rsFriends.getString("followed");
                    userEdges.add(new Tuple2<>(follower, followed));
                    userEdges.add(new Tuple2<>(followed, follower));
                    System.err.println(follower);
                }
            }

        } catch (SQLException e) {
            System.err.println("SQL Exception: " + e.getMessage());
        }

        // Convert the list to a JavaRDD and then to a JavaPairRDD
        // JavaRDD<Tuple2<String, String>> rdd = context.parallelize(edges);
        // return rdd.mapToPair(tuple -> tuple);

        JavaPairRDD<String, String> hashtagEdgesJ = context.parallelizePairs(hashtagEdges);
        JavaPairRDD<String, String> userHashtagEdgesJ = context.parallelizePairs(userHashtagEdges);
        JavaPairRDD<String, String> postEdgesJ = context.parallelizePairs(postEdges);
        JavaPairRDD<String, String> userPostEdgesJ = context.parallelizePairs(userPostEdges);
        JavaPairRDD<String, String> userEdgesJ = context.parallelizePairs(userEdges);

        // Assign weights
        JavaPairRDD<String, Tuple2<String, Double>> weightedHashtagEdges = assignEqualWeights(hashtagEdgesJ, 1.0);
        JavaPairRDD<String, Tuple2<String, Double>> weightedUserHashtagEdges = assignEqualWeights(userHashtagEdgesJ, 0.3);
        JavaPairRDD<String, Tuple2<String, Double>> weightedPostEdges = assignEqualWeights(postEdgesJ, 1.0);
        JavaPairRDD<String, Tuple2<String, Double>> weightedUserPostEdges = assignEqualWeights(userPostEdgesJ, 0.4);
        JavaPairRDD<String, Tuple2<String, Double>> weightedUserEdges = assignEqualWeights(userEdgesJ, 0.3);

        this.users = weightedUserHashtagEdges
                                    .union(weightedUserPostEdges)
                                    .union(weightedUserEdges);

        return weightedHashtagEdges
                    .union(weightedUserHashtagEdges)
                    .union(weightedPostEdges)
                    .union(weightedUserPostEdges)
                    .union(weightedUserEdges);

    }

    private JavaPairRDD<String, Tuple2<String, Double>> assignEqualWeights(JavaPairRDD<String, String> edges, double totalWeight) {
        // Count the occurrences of each node as a key
        JavaPairRDD<String, Integer> counts = edges.mapToPair(s -> new Tuple2<>(s._1(), 1)).reduceByKey(Integer::sum);

        // Calculate weights by joining with the original edges and normalizing
        return edges.join(counts)
                    .mapToPair(data -> {
                        String node = data._1();
                        String connectedNode = data._2()._1();
                        Integer count = data._2()._2();
                        double weight = totalWeight / count;  // Normalize the total weight by the number of edges
                        return new Tuple2<>(node, new Tuple2<>(connectedNode, weight));
                    });
    }

    /**
     * Retrieves the sinks in the provided graph.
     *
     * @param network The input graph represented as a JavaPairRDD.
     * @return A JavaRDD containing the nodes with no outgoing edges.
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Find the sinks in the provided graph
        // fix sinks
        JavaRDD<String> sinks = network.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()))
                                        .leftOuterJoin(network)
                                        .filter(pair -> !pair._2()._2().isPresent()) // Check if the right side is not null
                                        .map(pair -> pair._1()) // Retrieve only the keys
                                        .distinct();
        return sinks;
    }

    public class DescendingDoubleComparator implements Serializable, Comparator<Tuple2<String, Double>> {
        @Override
        public int compare(Tuple2<String, Double> tuple1, Tuple2<String, Double> tuple2) {
            // Compare the second elements of the tuples in descending order
            return tuple2._2().compareTo(tuple1._2()); // Descending order
        }
    }

    public JavaPairRDD<String, Double> propagateLabels(JavaPairRDD<String, Double> labels, JavaPairRDD<String, Tuple2<String, Double>> edges) {
    // Propagate labels using a join operation and update label values
        JavaPairRDD<String, Double> propagated = labels.join(edges)
                    .flatMapToPair(item -> {
                        List<Tuple2<String, Double>> newLabels = new ArrayList<>();
                        String sourceNode = item._1();
                        Tuple2<String, Double> edge = item._2()._2();
                        newLabels.add(new Tuple2<>(edge._1(), item._2()._1() * edge._2())); // Multiply source label by edge weight
                        return newLabels.iterator();
                    })
                    .reduceByKey((a, b) -> a + b); // Sum up contributions for each node

        // Calculate total weight for normalization
        JavaPairRDD<String, Double> totalWeights = propagated.mapValues(value -> value)
                                                            .reduceByKey((a, b) -> a + b);

        // Normalize the weights so that they sum to 1 for each node
        return propagated.join(totalWeights)
                        .mapToPair(item -> new Tuple2<>(item._1(), item._2()._1() / item._2()._2()));
    }
    
    public boolean convergenceCheck(JavaPairRDD<String, Double> oldLabels, JavaPairRDD<String, Double> newLabels) {
        // Define a small epsilon value as the convergence threshold
        double epsilon = 0.001;  // Adjust this threshold based on the sensitivity needed for your application

        // Compare old and new labels to decide on convergence
        double totalDiff = oldLabels.join(newLabels)
                                    .mapToDouble(item -> Math.abs(item._2()._1() - item._2()._2()))
                                    .reduce((a, b) -> a + b);  // Sum all differences

        return totalDiff < epsilon;
    }
    private static boolean tableExists(Connection connection, String tableName) throws SQLException {
        DatabaseMetaData dbm = connection.getMetaData();
        try (var rs = dbm.getTables(null, null, tableName, null)) {
            return rs.next();
        }
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRank algorithm to compute the ranks of nodes in a social network.
     *
     * @param debug a boolean value indicating whether to enable debug mode
     * @return a list of tuples containing the node ID and its corresponding SocialRank value
     * @throws IOException          if there is an error reading the social network data
     * @throws InterruptedException if the execution is interrupted
     */
    public List<Tuple2<String, Double>> run(boolean debug) throws IOException, InterruptedException, SQLException {

        // Load the social network, aka. the edges
        JavaPairRDD<String, Tuple2<String, Double>> edgeRDD = getSocialNetworkFromJDBC();

        JavaPairRDD<String, Double> userLabels = this.users.keys().mapToPair(node -> new Tuple2<>(node, 1.0)).distinct();

        // Create an RDD from edgeRDD containing all unique nodes with a label of 0.0
        JavaPairRDD<String, Double> allNodeLabels = edgeRDD
            .flatMap(pair -> Arrays.asList(pair._1(), pair._2()._1()).iterator())  // Convert List to Iterator
            .distinct()
            .mapToPair(node -> new Tuple2<>(node, 0.0));

        // Merge the two RDDs, giving preference to user labels (1.0 overrides 0.0)
        JavaPairRDD<String, Double> labels = allNodeLabels
            .union(userLabels)
            .reduceByKey(Math::max); 

        for (int i = 0; i < MAX_ITERATIONS; i++) {
            JavaPairRDD<String, Double> newLabels = propagateLabels(labels, edgeRDD);
            // Implement a convergence check here
            if (convergenceCheck(labels, newLabels)) {
                break;
            }
            labels = newLabels;
        }

        // labels contain all nodes and their weights
        // After the label propagation is complete, sort the labels by their values in descending order
        JavaPairRDD<String, Double> sortedLabels = labels
            .mapToPair(label -> label.swap()) // swap to make the value the key
            .sortByKey(false) // false for descending
            .mapToPair(label -> label.swap()); // swap back to original form

        // Collect the top 20 labels
        List<Tuple2<String, Double>> top20Labels = sortedLabels.take(20);

        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD)) {
            if (!tableExists(connection, "RankResults")) {
                try (Statement statement = connection.createStatement()) {
                    String sqlCreate = "CREATE TABLE RankResults (" +
                                       "id INT AUTO_INCREMENT PRIMARY KEY, " +
                                       "node VARCHAR(255) NOT NULL, " +
                                       "rank DOUBLE NOT NULL)";
                    statement.executeUpdate(sqlCreate);
                }
            }
        }
        String query = "INSERT INTO RankResults (node, rank) VALUES (?, ?)";
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD);
             PreparedStatement statement = connection.prepareStatement(query)) {
            for (Tuple2<String, Double> result : top20Labels) {
                statement.setString(1, result._1);
                statement.setDouble(2, result._2);
                statement.executeUpdate();
            }
        }

        return top20Labels;
        
    }
}
