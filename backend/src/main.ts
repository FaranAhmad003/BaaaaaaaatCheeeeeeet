import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config(); 

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000', 
    credentials: true,               
  });

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port);
}
bootstrap();
