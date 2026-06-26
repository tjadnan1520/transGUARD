import app from "./app.js";
import env from "./config/env.js";

app.listen(env.port, () => {
    console.log(`
======================================
🚀 TransGuard API Started Successfully
======================================
Environment : ${env.nodeEnv}
Port        : ${env.port}
URL         : http://localhost:${env.port}
======================================
`);
});