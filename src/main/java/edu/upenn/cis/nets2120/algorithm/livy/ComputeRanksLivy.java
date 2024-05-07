package edu.upenn.cis.nets2120.algorithm.livy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import edu.upenn.cis.nets2120.algorithm.SparkJob;
import edu.upenn.cis.nets2120.algorithm.ComputeRanks;
import scala.Tuple2;

/**
 * The `ComputeRanksLivy` class is responsible for running a social network ranking job using Apache Livy.
 * It takes command line arguments to configure the job parameters and performs the following tasks:
 * 1. Runs a SocialRankJob with backlinks set to true and writes the output to a file named "socialrank-livy-backlinks.csv".
 * 2. Runs a SocialRankJob with backlinks set to false and writes the output to a file named "socialrank-livy-nobacklinks.csv".
 * 3. Compares the top-10 results from both runs and writes the comparison to a file named "socialrank-livy-results.txt".
 * <p>
 * The class uses the Apache Livy library to submit and execute the jobs on a Livy server.
 * It also uses the SparkJob class to run the SocialRankJob and obtain the results.
 * <p>
 * To run the job, the `LIVY_HOST` environment variable must be set. If not set, the program will exit with an error message.
 */
public class ComputeRanksLivy {
    static Logger logger = LogManager.getLogger(ComputeRanksLivy.class);

    public static void main(String[] args)
            throws IOException, URISyntaxException, InterruptedException, ExecutionException {
        boolean debug;

        double d_max;
        int i_max;

        // Check so we'll fatally exit if the environment isn't set
        if (System.getenv("LIVY_HOST") == null) {
            logger.error("LIVY_HOST not set -- update your .env and run source .env");
            System.exit(-1);
        }

        // Process command line arguments if given
        if (args.length == 1) {
            d_max = Double.parseDouble(args[0]);
            i_max = 25;
            debug = false;
        } else if (args.length == 2) {
            d_max = Double.parseDouble(args[0]);
            i_max = Integer.parseInt(args[1]);
            debug = false;
        } else if (args.length == 3) {
            d_max = Double.parseDouble(args[0]);
            i_max = Integer.parseInt(args[1]);
            debug = true;
        } else {
            d_max = 30;
            i_max = 25;
            debug = false;
        }

        String livy = SparkJob.getLivyUrl(args);

        // Second call to Apache Livy to run SocialRankJob with back-links set to false
        while(true)
        {
            SocialRankJob noBlJob = new SocialRankJob(d_max, i_max, 1000, false, debug);

            List<Tuple2<String, Tuple2<Double, Tuple2<String, Double>>>> result = SparkJob.runJob(livy, noBlJob);
            JavaPairRDD<String, Iterable<Tuple2<String, Double>>> adjacencyList = result.flatMapToPair(pair -> Arrays.asList(
                new Tuple2<>(pair._1(), new Tuple2<>(pair._2()._2()._1(), pair._2()._1())),
                new Tuple2<>(pair._2()._2()._1(), new Tuple2<>(pair._1(), pair._2()._1()))
            ))
            .groupByKey()
            .cache(); 
        }

        // run random walk alg --> select posts to be recommended

        // 



        logger.info("*** Finished social network ranking! ***");
        // Thread.sleep(3600000); 

    }

}
