import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus, Ip } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as Express from 'express'
import { ApiKey, ApiType } from 'src/resource/database/entity/ApiKey.entity'
import { OrderType, PaymentGateway, PaymentStatus } from 'src/resource/database/entity/payment/Payment.entity'
import { Transaction, TransactionTypes } from 'src/resource/database/entity/payment/Transaction.entity'
import { VirtualAccount } from 'src/resource/database/entity/payment/VirtualAccount.entity'
import { getDatabaseClient } from 'src/resource/database/main'
import { Exception } from 'src/resource/plugin/error.plugin'
import paymentPlugin from 'src/resource/plugin/payment.plugin'
import tokenPlugin from 'src/resource/plugin/token.plugin'
import { Banks } from 'src/resource/plugin/tossPayments.plugin'
import userPlugin from 'src/resource/plugin/user.plugin'
import utilityPlugin from 'src/resource/plugin/utility.plugin'

@Controller()
    export class ApplicationController {
    constructor (
    ) {  }

    @Post('v0/payment')
    async createPayment (@Request() _request: Express.Request, @Response() _response: Express.Response, @Headers('X-API-KEY') _apiKey: string, @Body() _body: {
        order: { id: string, name: string, products: Array<{ name: string, price: number }> },
        amount: { supply: number, tax_free: number, vat: number },
        secret_key: string,
        valid_hour: number
    }, @Next() _next: Express.NextFunction) {
        try {
            const _apiKeys = await getDatabaseClient().manager.getRepository(ApiKey).find({ where: { key: _apiKey, is_active: true } })
            if(_apiKeys.length !== 1) return _next(new Exception(_request, 'Wrong api key.', HttpStatus.BAD_REQUEST))

            const _paymentResult = await paymentPlugin.Payment.create(_apiKeys[0].application_id, _apiKeys[0].type == ApiType.Billing ? OrderType.BILLING : OrderType.NORMAl, _body.order, { suppliedAmount: _body.amount.supply, taxFreeAmount: _body.amount.tax_free, vat: _body.amount.vat }, _body.secret_key, _body.valid_hour, PaymentGateway.TossPayment)
            if(_paymentResult.success == false) return _next(new Exception(_request, _paymentResult.error.cause instanceof Error ? _paymentResult.error.cause.message : _paymentResult.error.message, HttpStatus.BAD_REQUEST, _paymentResult.error))

            return _response.status(200).json({ success: true, data: {
                id: _paymentResult.id,
                status: _paymentResult.status.toLowerCase(),
                expires_at: _paymentResult.expiresDate.toISOString()
            }, error: null, requested_at: new Date().toISOString() })
        } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
    }
}
