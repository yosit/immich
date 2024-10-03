import { BullModule } from '@nestjs/bullmq';
import { Inject, Module, OnModuleDestroy, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, ModuleRef } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import _ from 'lodash';
import { ClsModule } from 'nestjs-cls';
import { OpenTelemetryModule } from 'nestjs-otel';
import { commands } from 'src/commands';
import { bullConfig, bullQueues, clsConfig, immichAppConfig } from 'src/config';
import { controllers } from 'src/controllers';
import { databaseConfig } from 'src/database.config';
import { entities } from 'src/entities';
import { IEventRepository } from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthGuard } from 'src/middleware/auth.guard';
import { ErrorInterceptor } from 'src/middleware/error.interceptor';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor';
import { repositories } from 'src/repositories';
import { services } from 'src/services';
import { DatabaseService } from 'src/services/database.service';
import { setupEventHandlers } from 'src/utils/events';
import { otelConfig } from 'src/utils/instrumentation';

const common = [...services, ...repositories];

const middleware = [
  FileUploadInterceptor,
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, whitelist: true }) },
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
  { provide: APP_GUARD, useClass: AuthGuard },
];

const imports = [
  BullModule.forRoot(bullConfig),
  BullModule.registerQueue(...bullQueues),
  ClsModule.forRoot(clsConfig),
  ConfigModule.forRoot(immichAppConfig),
  OpenTelemetryModule.forRoot(otelConfig),
  TypeOrmModule.forRootAsync({
    inject: [ModuleRef],
    useFactory: (moduleRef: ModuleRef) => {
      return {
        ...databaseConfig,
        poolErrorHandler: (error) => {
          moduleRef.get(DatabaseService, { strict: false }).handleConnectionError(error);
        },
      };
    },
  }),
  TypeOrmModule.forFeature(entities),
];

@Module({
  imports: [...imports, ScheduleModule.forRoot()],
  controllers: [...controllers],
  providers: [...common, ...middleware],
})
export class ApiModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private moduleRef: ModuleRef,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {}

  async onModuleInit() {
    const items = setupEventHandlers(this.moduleRef);

    await this.eventRepository.emit('app.bootstrap', 'api');

    this.logger.setContext('EventLoader');
    const eventMap = _.groupBy(items, 'event');
    for (const [event, handlers] of Object.entries(eventMap)) {
      for (const { priority, label } of handlers) {
        this.logger.verbose(`Added ${event} {${label}${priority ? '' : ', ' + priority}} event`);
      }
    }
  }

  async onModuleDestroy() {
    await this.eventRepository.emit('app.shutdown');
  }
}

@Module({
  imports: [...imports],
  providers: [...common, SchedulerRegistry],
})
export class MicroservicesModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private moduleRef: ModuleRef,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
  ) {}

  async onModuleInit() {
    setupEventHandlers(this.moduleRef);
    await this.eventRepository.emit('app.bootstrap', 'microservices');
  }

  async onModuleDestroy() {
    await this.eventRepository.emit('app.shutdown');
  }
}

@Module({
  imports: [...imports],
  providers: [...common, ...commands, SchedulerRegistry],
})
export class ImmichAdminModule {}
