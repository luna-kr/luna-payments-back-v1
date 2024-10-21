import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { PaymentController } from 'src/controller/payment.controller'
import { TokenController } from 'src/controller/token.controller'
import InternalMiddleware from 'src/middleware/internal.middleware'
import { TokenService } from 'src/service/token.service'
import { EntityManager } from 'typeorm'

@Module({
    imports: [  ],
    controllers: [ PaymentController ],
    providers: [ EntityManager ],
})

export class PaymentModule implements NestModule {
    configure(_consumer: MiddlewareConsumer) {
        _consumer
            .apply(InternalMiddleware)
            .forRoutes(PaymentController)
    }
}
  