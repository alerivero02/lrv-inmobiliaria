import "dotenv/config";
import { migrate } from "./db.js";
import { createApp } from "./app.js";

await migrate();

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀  LRV Backend → http://localhost:${PORT}`);
  console.log(`   Admin:    http://localhost:5173/admin/login`);
  console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});
