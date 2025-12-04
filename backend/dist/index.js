"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const bootstrap = () => {
    const port = env_1.env.PORT;
    app_1.default.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`🚀 API server listening on http://localhost:${port}`);
    });
};
bootstrap();
//# sourceMappingURL=index.js.map