import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus, Ip } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as Express from 'express'
import { PaymentStatus } from 'src/resource/database/entity/payment/Payment.entity'
import { Transaction, TransactionTypes } from 'src/resource/database/entity/payment/Transaction.entity'
import { VirtualAccount } from 'src/resource/database/entity/payment/VirtualAccount.entity'
import { getDatabaseClient } from 'src/resource/database/main'
import { Exception } from 'src/resource/plugin/error.plugin'
import paymentPlugin from 'src/resource/plugin/payment.plugin'
import tokenPlugin from 'src/resource/plugin/token.plugin'
import { Banks } from 'src/resource/plugin/tossPayments.plugin'
import userPlugin from 'src/resource/plugin/user.plugin'
import utilityPlugin from 'src/resource/plugin/utility.plugin'
import libphonenumber from 'libphonenumber-js'
import { TossPayments, TP_PaymentMethod } from 'src/resource/database/entity/payment/TossPayment.entity'

@Controller()
    export class PaymentController {
    constructor (
    ) {  }

    
    @Get('v0/payment/:paymentId')
    async getPayment (@Request() _request: Express.Request, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Param('paymentId') _paymentId: string, @Next() _next: Express.NextFunction) {
        try {
            const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
            if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))

            try {
                utilityPlugin.validateUUID(_paymentId)
            } catch(_error) { return _next(new Exception(_request, 'Invalid payment id.', HttpStatus.BAD_REQUEST, new Error())) }
            const _payment = await paymentPlugin.Payment.find(utilityPlugin.validateUUID(_paymentId))
            if(_payment.success == false) return _next(new Exception(_request, _payment.error.cause instanceof Error ? _payment.error.cause.message : _payment.error.message, HttpStatus.BAD_REQUEST, _payment.error))


            let _userId: string & { __brand: 'UUID' } | null = null
            if(typeof _sessionToken.userId == 'string') {
                const _userinfo = await userPlugin.User.search(_sessionToken.userId)
                if(_userinfo.success == false) return _next(new Exception(_request, 'Failed to fetch user data.', HttpStatus.INTERNAL_SERVER_ERROR, _userinfo.error))
                _userId = _userinfo.id
            }


            if([ PaymentStatus.PENDING, PaymentStatus.PROGRESS ].includes(_payment.status) == true) {
                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
    
                    order: _payment.order,
    
                    amount: {
                        total_amount: _payment.amount.total,
                        supplied_amount: _payment.amount.suppliedAmount,
                        tax_free_amount: _payment.amount.taxFreeAmount,
                        vat: _payment.amount.VAT
                    },
                    status: _payment.status.toLowerCase()
                }, error: null, requested_at: new Date().toISOString() })
            } else if([ PaymentStatus.WAITING ].includes(_payment.status) == true) {
                const _virtualAccounts = await getDatabaseClient().manager.getRepository(VirtualAccount).find({ where: { payment_id: _payment.id, is_active: true } })
                if(_virtualAccounts.length !== 1) return _next(new Exception(_request, 'Failed to fetch virtual account.', HttpStatus.INTERNAL_SERVER_ERROR))
                
                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
                    virtual_account: {
                        account_number: _virtualAccounts[0].account_number,
                        bank: Banks.filter(function (_bank) { return _bank.code.two == _virtualAccounts[0].bank_code })[0].displayName,
                        expires_at: _virtualAccounts[0].due_date.toISOString()
                    },
                    order: _payment.order,
                    amount: {
                        total_amount: _payment.amount.total,
                        supplied_amount: _payment.amount.suppliedAmount,
                        tax_free_amount: _payment.amount.taxFreeAmount,
                        vat: _payment.amount.VAT
                    },
                    status: _payment.status.toLowerCase()
                }, error: null, requested_at: new Date().toISOString() })
            } else if([ PaymentStatus.DONE ].includes(_payment.status) == true) {
                const _transactions = await getDatabaseClient().manager.getRepository(Transaction).find({ where: { payment_id: _payment.id, type: TransactionTypes.PAYMENT, is_active: true } })

                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
                    payment_method: _transactions[0].payment_method.toLowerCase(),
                    approved_at: _transactions[0].approved_date.toISOString(),
                    order: _payment.order,
                    amount: {
                        total_amount: _payment.amount.total,
                        supplied_amount: _payment.amount.suppliedAmount,
                        tax_free_amount: _payment.amount.taxFreeAmount,
                        vat: _payment.amount.VAT
                    },
                    status: _payment.status.toLowerCase()
                }, error: null, requested_at: new Date().toISOString() })
            } else if([ PaymentStatus.PARTIAL_CANCELED, PaymentStatus.CANCELED ].includes(_payment.status) == true) {
                const _transactions = await getDatabaseClient().manager.getRepository(Transaction).find({ where: { payment_id: _payment.id, is_active: true } })

                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
                    payment_method: _transactions.find(_transaction => _transaction.type == TransactionTypes.PAYMENT).payment_method.toLowerCase(),
                    approved_at: _transactions.find(_transaction => _transaction.type == TransactionTypes.PAYMENT).approved_date.toISOString(),
                    amount: _payment.amount.total,
                    canceled_at: _transactions.find(_transaction => _transaction.type == TransactionTypes.CANCEl).approved_date.toISOString(),
                    cancled_amount: _transactions.find(_transaction => _transaction.type == TransactionTypes.CANCEl).amount,
                    status: _payment.status.toLowerCase()
                }, error: null, requested_at: new Date().toISOString() })
            } else if([ PaymentStatus.FAILURE ].includes(_payment.status) == true) {
                
            } else return _next(new Exception(_request, 'Invalid payment status.', HttpStatus.INTERNAL_SERVER_ERROR, new Error()))
        } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
    }

    @Post('v0/payment/:paymentId/process')
    async processPayment (@Request() _request: Express.Request, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Param('paymentId') _paymentId: string, @Body() _body:
        { type: 'username_and_password', credentials: { username: string, password: string } }
        | { type: 'card' }
        | { type: 'confirm', payment_key?: string, process_id?: string }
        | { type: 'issue_virtual_account', bank: string, cash_receipt?: { type: 'individual' | 'business', code: string } }
        | { type: 'register_customer', customer: { name: string, phone_number: string, email_address: string } },
    @Next() _next: Express.NextFunction, @Ip() _ipAddress: string) {
        try {
            const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
            if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))

            try {
                utilityPlugin.validateUUID(_paymentId)
            } catch(_error) { return _next(new Exception(_request, 'Invalid payment id.', HttpStatus.BAD_REQUEST, new Error())) }
            const _payment = await paymentPlugin.Payment.find(utilityPlugin.validateUUID(_paymentId))
            if(_payment.success == false) return _next(new Exception(_request, 'Failed to fetch payment.', HttpStatus.BAD_REQUEST, _payment.error))

            if(_payment.status !== PaymentStatus.PENDING) return _next(new Exception(_request, 'Already processed.', HttpStatus.BAD_REQUEST))
            // let _userId: string & { __brand: 'UUID' } | null = null
            // if(typeof _sessionToken.userId == 'string') {
            //     const _userinfo = await userPlugin.User.search(_sessionToken.userId)
            //     if(_userinfo.success == false) return _next(new Exception(_request, 'Failed to fetch user data.', HttpStatus.INTERNAL_SERVER_ERROR, _userinfo.error))
            // }

            if(_body.type == 'username_and_password') {
                const _result = await _payment.Process.Cultureland.authenticate(_body.credentials, _ipAddress)
                if(_result.success == false) return _next(new Exception(_request, _result.error.cause instanceof Error ? _result.error.cause.message : _result.error.message, HttpStatus.BAD_REQUEST, _result.error))

                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
                    balance: _result.balance,
                    is_available: _result.balance >= _payment.amount.total
                }, error: null, requested_at: new Date().toISOString() })
            } else if(_body.type == 'card') {
                if(_payment.status !== PaymentStatus.PENDING) return _next(new Exception(_request, 'Invalid request.', HttpStatus.FORBIDDEN))
                await getDatabaseClient().manager.getRepository(TossPayments).update({ payment_id: _payment.id, is_active: true }, { is_active: false })
                const _TossPayments = new TossPayments()
                _TossPayments.payment_id = _payment.id
                _TossPayments.payment_method = TP_PaymentMethod.카드
                const _tossPayment = await getDatabaseClient().manager.save(_TossPayments)

                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
                    process_id: _tossPayment.uuid
                }, error: null, requested_at: new Date().toISOString() })
            } else if(_body.type == 'confirm') {
                if(typeof _body.payment_key == 'string') {
                    try { utilityPlugin.validateUUID(_body.process_id) } catch (_error) { return _next(new Exception(_request, 'Invalid process id.', HttpStatus.BAD_REQUEST, new Error())) }
                    const _result = await _payment.Process.confirm(_body.payment_key, utilityPlugin.validateUUID(_body.process_id))
                    if(_result.success == false) return _next(new Exception(_request, _result.error.cause instanceof Error ? _result.error.cause.message : _result.error.message, HttpStatus.BAD_REQUEST, _result.error))

                    return _response.status(200).json({ success: true, data: {
                        id: _payment.id,
                        payment_method: _result.paymentMethod.toLowerCase(),
                        approved_at: _result.approvedDate.toISOString()
                    }, error: null, requested_at: new Date().toISOString() })
                } else {
                    const _result = await _payment.Process.Cultureland.process()
                    if(_result.success == false) return _next(new Exception(_request, _result.error.cause instanceof Error ? _result.error.cause.message : _result.error.message, HttpStatus.BAD_REQUEST, _result.error))

                    return _response.status(200).json({ success: true, data: {
                        id: _payment.id,
                        payment_method: _result.paymentMethod.toLowerCase(),
                        approved_at: _result.approvedDate.toISOString()
                    }, error: null, requested_at: new Date().toISOString() })
                }
            } else if(_body.type == 'issue_virtual_account') {
                if(_payment.customer == undefined) return _next(new Exception(_request, 'Registration of customer information is required.', HttpStatus.FORBIDDEN))
                const _result = await _payment.Process.VirtualAccount.issue(_body.bank, _payment.customer, _body.cash_receipt)
                if(_result.success == false) return _next(new Exception(_request, _result.error.cause instanceof Error ? _result.error.cause.message : _result.error.message, HttpStatus.BAD_REQUEST, _result.error))

                return _response.status(200).json({ success: true, data: {
                    id: _payment.id,
                    account_number: _result.virtualAccount.accountNumber,
                    bank: _result.virtualAccount.bank,
                    expires_at: _result.virtualAccount.expiresDate.toISOString()
                }, error: null, requested_at: new Date().toISOString() })
            } else if(_body.type == 'register_customer') {
                if(utilityPlugin.isEmailAddress(_body.customer.email_address) == false) return _next(new Exception(_request, 'Invalid email address.', HttpStatus.BAD_REQUEST))
                if(libphonenumber(_body.customer.phone_number)?.isValid() !== true) return _next(new Exception(_request, 'Invalid phone number.', HttpStatus.BAD_REQUEST))
                
                const _result = await _payment.Process.updateInformation(_body.customer.name, libphonenumber(_body.customer.phone_number)?.format('INTERNATIONAL'), _body.customer.email_address)
                if(_result.success == false) return new Exception(_request, _result.error.cause instanceof Error ? _result.error.cause.message : _result.error.message, HttpStatus.BAD_REQUEST, _result.error)
                
                return _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })
            } else return _next(new Exception(_request, 'Wrong type.', HttpStatus.BAD_REQUEST))
        } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
    }
}
