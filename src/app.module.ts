import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [EventsModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB'),
        entities: [__dirname+'/**/*.entity{.ts,.js}'],
        synchronize: (configService.get('PRODUCTION') !== 'true'),
        // logging: true,
        // trace: true,
        cache: true
      }),
      inject: [ConfigService],
  }),
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env', '.env.default']
  })
],
  controllers: [],
  providers: [],
})
export class AppModule {}
