import jwt from "jsonwebtoken"

const genToken = async (userId) => {
    try {
      // Ensure a secret exists in development to avoid "Illegal arguments" errors
      if (!process.env.JWT_SECRET) {
        console.warn(
          "JWT_SECRET is not set — using development fallback secret.\n" +
            "Set JWT_SECRET in your backend .env for production.",
        );
        process.env.JWT_SECRET = "dev_secret_change_me";
      }

      const token = await jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "10d",
      });

      return token;
    } catch (error) {
        console.log(error)
    }
}

export default genToken