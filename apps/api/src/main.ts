import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

// Serialize BigInt (Prisma money columns) as strings in JSON responses.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  app.use(helmet());
  app.use(cookieParser());

  const origins = config
    .get<string>("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: true });

  app.setGlobalPrefix(config.get<string>("API_GLOBAL_PREFIX", "api"));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Escrow Platform API")
    .setDescription("Secure escrow transactions API. OpenAPI spec (spec §2, §17).")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get<number>("API_PORT", 4000);
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/${config.get("API_GLOBAL_PREFIX", "api")}`);
  logger.log(`OpenAPI docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
