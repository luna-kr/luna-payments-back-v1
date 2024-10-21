import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ApplicationController } from 'src/controller/application.controller'
import { PaymentController } from 'src/controller/payment.controller'
import InternalMiddleware from 'src/middleware/internal.middleware'
import { EntityManager } from 'typeorm'

@Module({
    imports: [  ],
    controllers: [ ApplicationController ],
    providers: [ EntityManager ],
})

export class ApplicationModule implements NestModule {
    configure(_consumer: MiddlewareConsumer) {

    }
}
  