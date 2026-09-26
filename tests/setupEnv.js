// Runs before each test file: use the in-memory store and known credentials.
import bcrypt from "bcryptjs";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "memory";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.ADMIN_PASSWORD = "correct horse battery staple";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 4);
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_CHAT_ID;
