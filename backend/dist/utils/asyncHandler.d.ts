import type { NextFunction, Request, Response } from 'express';
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare const asyncHandler: (handler: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map