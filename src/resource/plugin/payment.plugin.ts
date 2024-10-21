import { ApplicationStatus, Application } from '../database/entity/Application.entity'
import { Currency, OrderType, Payment, PaymentGateway, PaymentMethod, PaymentStatus } from '../database/entity/payment/Payment.entity'
import { getDatabaseClient } from '../database/main'
import tossPaymentPlugin from './tossPayments.plugin'
import utilityPlugin from './utility.plugin'
import paymentPlugin from './payment.plugin'
import { TP_CashReceiptType } from '../database/entity/payment/TossPayment.entity'

export default {
    Payment: {
        find: async (
            _id: string & { __brand: 'UUID' }
        ): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                type: OrderType,
                order: { id: string, name: string, products: Array<{ name: string, price: number }> },
                amount: { total: number, suppliedAmount: number, taxFreeAmount: number, VAT: number },
                verification: { secret: string, token: string },
                status: PaymentStatus,
                applicationId: string,
                createdDate: Date,
                expiresDate: Date,

                customer?: { fullName: string, phoneNumber: string, emailAddress: string },

                Process: {
                    updateInformation: (_fullName: string, _phoneNumber: string, _emailAddress: string)
                        => Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        >,
                    updatePayment: (
                        _order: { name: string },
                        _products: Array<{ name: string, price: number }>,
                        _amount: { total: number, suppliedAmount: number, taxFreeAmount: number, VAT: number }
                    ) => Promise<
                            { success: true }
                            | { success: false, error?: Error }
                        >,
                    confirm: (_paymentKey: string, _processId: string & { __brand: 'UUID' })
                        => Promise<
                            { success: true, paymentMethod: PaymentMethod, approvedDate: Date }
                            | { success: false, error?: Error }
                        >,
                    Cultureland: {
                        authenticate: (_credentials: { username: string, password: string }, _ipAddress: string)
                            => Promise<
                                { success: true, balance: number }
                                | { success: false, error?: Error }
                            >,
                        process: () => Promise<
                            { success: true, paymentMethod: PaymentMethod, approvedDate: Date }
                            | { success: false, error?: Error }
                        >
                    },
                    VirtualAccount: {
                        issue: (_bank: string, _customer?: { fullName: string, phoneNumber: string, emailAddress: string }, _cashReceipt?: { type: 'individual' | 'business', code: string })
                            => Promise<
                                { success: true, virtualAccount: { bank: { kor: string, eng: string }, accountNumber: string, expiresDate: Date } }
                                | { success: false, error?: Error }
                            >
                    }
                }
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _payments = await getDatabaseClient().manager.getRepository(Payment).find({ where: { uuid: _id, is_active: true } })
                if(_payments.length !== 1) return { success: false, error: new Error('Wrong payment id.') }
                if(_payments[0].status !== PaymentStatus.DONE && _payments[0].expires_date.getTime() <= new Date().getTime()) return { success: false, error: new Error('Expired payment.') }
                return {
                    success: true,
                    id: _payments[0].uuid,
                    type: _payments[0].order_type,
    
                    order: {
                        id: _payments[0].order_id,
                        name: _payments[0].order_name,
                        products: _payments[0].products
                    },
                    amount: {
                        total: _payments[0].total_amount,
    
                        suppliedAmount: _payments[0].supplied_amount,
                        taxFreeAmount: _payments[0].tax_free,
    
                        VAT: _payments[0].vat
                    },
    
                    verification: {
                        secret: _payments[0].secret,
                        token: _payments[0].token
                    },
    
                    status: _payments[0].status,
    
                    applicationId: _payments[0].application_id,
    
                    createdDate: _payments[0].created_date,
                    expiresDate: _payments[0].expires_date,

                    customer: [ _payments[0].full_name, _payments[0].phone_number, _payments[0].email_address ].includes(null)
                        ? undefined
                        : { fullName: _payments[0].full_name, phoneNumber: _payments[0].phone_number, emailAddress: _payments[0].email_address },

                    Process: {
                        updateInformation: async (_fullName: string, _phoneNumber: string, _emailAddress: string) => {
                            try {
                                const _updateResult = await getDatabaseClient().manager.getRepository(Payment).update({ uuid: _payments[0].uuid, is_active: true }, { full_name: _fullName, phone_number: _phoneNumber, email_address: _emailAddress })
                                if(_updateResult.affected !== 1) return { success: false, error: new Error('Failed to update object.') }
                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        updatePayment: async (
                            _order: { name: string },
                            _products: Array<{ name: string, price: number }>,
                            _amount: { total: number, suppliedAmount: number, taxFreeAmount: number, VAT: number }
                        ) => {
                            try {
                                let _price: number = _products.map(_product => _product.price).reduce((_previous, _current) => _previous + _current)
                                if(_price !== (_amount.suppliedAmount + _amount.taxFreeAmount)) return { success: false, error: new Error('Invalid product price or total amount.') }

                                const _updateResult = await getDatabaseClient().manager.getRepository(Payment).update({ uuid: _payments[0].uuid, is_active: true }, { order_name: _order.name, products: _products, total_amount: _amount.total, supplied_amount: _amount.suppliedAmount, tax_free: _amount.taxFreeAmount, vat: _amount.VAT })
                                if(_updateResult.affected !== 1) return { success: false, error: new Error('Failed to update object.') }

                                return { success: true }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        confirm: async (_paymentKey: string, _processId: string & { __brand: 'UUID' }) => {
                            try {
                                if(_payments[0].payment_gateway == PaymentGateway.TossPayment) {
                                    const _result = await tossPaymentPlugin.Payment.process(_payments[0].uuid, _paymentKey, _processId)
                                    if(_result.success == false) return { success: false, error: new Error('Failed to confirm', { cause: _result.error }) }

                                    return { success: true, paymentMethod: _result.paymentMethod, approvedDate: _result.approvedDate }
                                } else return { success: false, error: new Error('Payment Gateway is not registered.') }
                            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                        },
                        Cultureland: {
                            authenticate: async (_credentials: { username: string, password: string }, _ipAddress: string): Promise<
                                { success: true, balance: number }
                                | { success: false, error?: Error }
                            > => {
                                try {
                                    if(_payments[0].payment_gateway == PaymentGateway.TossPayment) {
                                        const _result = await tossPaymentPlugin.Payment.Cultureland.authenticate(_payments[0].uuid, _credentials, _ipAddress)
                                        if(_result.success == false) return { success: false, error: new Error('Failed to authenticate from Cultureland', { cause: _result.error }) }
                                        return { success: true, balance: Number(_result.culturelandBalance) }
                                    } else return { success: false, error: new Error('Payment Gateway is not registered.') }
                                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                            },
                            process: async (): Promise<
                                { success: true, paymentMethod: PaymentMethod, approvedDate: Date }
                                | { success: false, error?: Error }
                            > => {
                                try {
                                    if(_payments[0].payment_gateway == PaymentGateway.TossPayment) {
                                        const _result = await tossPaymentPlugin.Payment.Cultureland.process(_payments[0].uuid)
                                        if(_result.success == false) return { success: false, error: new Error('Failed to confirm') }

                                        return { success: true, paymentMethod: _result.paymentMethod, approvedDate: _result.approvedDate }
                                    } else return { success: false, error: new Error('Payment Gateway is not registered.') }
                                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                            }
                        },
                        VirtualAccount: {
                            issue: async (_bank: string, _customer?: { fullName: string, phoneNumber: string, emailAddress: string }, _cashReceipt?: { type: 'individual' | 'business', code: string }) => {
                                try {
                                    if([ _payments[0].full_name, _payments[0].phone_number ].includes(null) == true) {
                                        if(_customer == undefined) return { success: false, error: new Error('Customer information is required.') }
                                    }
                                    if(_payments[0].payment_gateway == PaymentGateway.TossPayment) {
                                        const _virtualAccount = await tossPaymentPlugin.Payment.VirtualAccount.issue(_payments[0].uuid, _payments[0].full_name ?? _customer.fullName, _payments[0].email_address ?? _customer.emailAddress, _payments[0].phone_number ?? _customer.phoneNumber, { type: _cashReceipt ? (_cashReceipt.type == 'individual' ? TP_CashReceiptType.소득공제 : TP_CashReceiptType.지출증빙) : TP_CashReceiptType.미발행, registrationNumber: _cashReceipt ? _cashReceipt.code : undefined }, _bank)
                                        if(_virtualAccount.success == false) return { success: false, error: new Error('Failed to issue virtual account.', { cause: _virtualAccount.error }) }
                                        return { success: true, virtualAccount: { accountNumber: _virtualAccount.accountNumber, bank: _virtualAccount.bank, expiresDate: _virtualAccount.expiresDate } }
                                    } else return { success: false, error: new Error('Payment Gateway is not registered.') }
                                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                            }
                        }

                    }
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        create: async (
            _applicationId: string,
            _type: OrderType,
            _order: { id: string, name: string, products: Array<{ name: string, price: number }> },
            _amount: { suppliedAmount: number, taxFreeAmount: number, vat: number },
            secret: string,
            _validHours: number
        ): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                type: OrderType,
                order: { id: string, name: string, products: Array<{ name: string, price: number }> },
                amount: { total: number, suppliedAmount: number, taxFreeAmount: number, VAT: number },
                verification: { secret: string, token: string },
                status: PaymentStatus,
                createdDate: Date,
                expiresDate: Date
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _validateData = await getDatabaseClient().manager.getRepository(Payment).find({ where: { order_id: _order.id } })
                if(_validateData.length !== 0) return { success: false, error: new Error('Duplicated order ID.') }

                let _price: number = _order.products.map(_product => _product.price).reduce((_previous, _current) => _previous + _current)
                if(_price !== (_amount.suppliedAmount + _amount.taxFreeAmount)) return { success: false, error: new Error('Invalid product price or total amount.') }
                const _Payment = new Payment()
                _Payment.application_id = _applicationId
                _Payment.currency = Currency.KRW
                _Payment.order_id = _order.id.replace(/ /gi, '')
                _Payment.order_name = _order.name
                _Payment.order_type = _type
        
                _Payment.partial_cancelable = false
        
                _Payment.products = _order.products
        
                _Payment.secret = secret
        
                _Payment.token = utilityPlugin.getRandomStrings(64)
        
                _Payment.total_amount = (_amount.suppliedAmount + _amount.vat) + _amount.taxFreeAmount
                _Payment.supplied_amount = _amount.suppliedAmount
                _Payment.vat = _amount.vat
                _Payment.tax_free = _amount.taxFreeAmount
        
                _Payment.expires_date = new Date(new Date().getTime() + (_validHours * 1000 * 60 * 60))
        
                const _result = await getDatabaseClient().manager.getRepository(Payment).save(_Payment)
        
                return await paymentPlugin.Payment.find(_result.uuid)
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    },
    Application: {
        find: async (
            _id: string & { __brand: 'UUID' }
        ): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                name: string,
                paymentMethods: Array<{ paymentMethod: PaymentMethod, status: 'Applied' | 'Reviewing' | 'Actived' | 'Suspended' | 'Terminated' }>
                status: ApplicationStatus
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _applications = await getDatabaseClient().manager.getRepository(Application).find({ where: { uuid: _id, is_active: true } })
                if(_applications.length !== 1) return { success: false, error: new Error('Wrong application id.') }
        
                return {
                    success: true,
                    id: _applications[0].uuid,
                    name: _applications[0].name,
                    paymentMethods: _applications[0].payment_methods.map(_paymentMethod => {
                        return {
                            paymentMethod: _paymentMethod.payment_method,
                            status: _paymentMethod.status
                        }
                    }),
                    status: _applications[0].status
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    }
}