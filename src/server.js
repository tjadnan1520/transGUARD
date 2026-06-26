import app from "./app.js";
import env from "./config/env.js";

app.listen(env.port, () => {
    console.log(`
Port        : ${env.port}
URL         : http://localhost:${env.port}
`);
});
