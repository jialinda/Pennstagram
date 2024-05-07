package edu.upenn.cis.nets2120.config;

/**
 * Global configuration for NETS 2120 homeworks.
 *
 * @author zives
 */
public class Config {

    // For test drivers
    public static void setSocialPath(String path) {
        SOCIAL_NET_PATH = path;
    }

    public static final String DATABASE_CONNECTION = "jdbc:mysql://localhost:3306/instaDB";
    public static final String DATABASE_USERNAME = "admin";
    public static final String DATABASE_PASSWORD = "netsfinalproject";

    public static final String SPARK_APP_NAME = "InstaRelations";
    public static final String SPARK_MASTER_URL = "local[*]";
    public static final String SPARK_DRIVER_MEMORY = "10g";
    public static final String SPARK_TESTING_MEMORY = "2147480000";
    /**
     * The path to the space-delimited social network data
     */

    public static String LOCAL_SPARK = "local[*]";

    public static String JAR = "target/nets2120-project-1.0.jar";

    // these will be set via environment variables
    public static String ACCESS_KEY_ID = System.getenv("AWS_ACCESS_KEY_ID");
    public static String SECRET_ACCESS_KEY = System.getenv("AWS_SECRET_ACCESS_KEY");
    public static String SESSION_TOKEN = System.getenv("AWS_SESSION_TOKEN");

    /**
     * How many RDD partitions to use?
     */
    public static int PARTITIONS = 5;
}
