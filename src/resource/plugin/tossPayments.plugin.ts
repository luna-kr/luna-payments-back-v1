import { TossPayments, TP_CardOwnerType, TP_CardType, TP_PaymentMethod, TP_PaymentStatus, TP_PaymentType, TP_Payment, TP_CashReceiptType } from '../database/entity/payment/TossPayment.entity'
import { Card, Currency, OrderType, Payment, PaymentGateway, PaymentMethod, PaymentStatus } from '../database/entity/payment/Payment.entity'
import { getDatabaseClient } from '../database/main'
import utilityPlugin from './utility.plugin'
import axios from 'axios'
import { CardOwnerTypes, CardTypes, Transaction, TransactionTypes } from '../database/entity/payment/Transaction.entity'
import { VirtualAccount, VirtualAccountStatus } from '../database/entity/payment/VirtualAccount.entity'
import { VirtualAccountTypes } from '../database/entity/payment/virtualAccount.entity'
import tossPaymentPlugin from './tossPayments.plugin'
import paymentPlugin from './payment.plugin'
import * as CryptoJS from 'crypto-js'

export const Banks: Array<{ displayName: { kor: string, eng: string }, code: { two: string, three: string, eng: string }, tossCode: string }> = [
    { displayName: { kor: 'NH농협은행', eng: 'Nonghyeop Bank' }, code: { two: '11', three: '011', eng: 'NONGHYEOP' }, tossCode: '농협은행' },
    { displayName: { kor: 'KB국민은행', eng: 'KB Kookmin Bank' }, code: { two: '06', three: '004', eng: 'KOOKMIN' }, tossCode: 'KB국민은행' },
    { displayName: { kor: '신한은행', eng: 'Shinhan Bank' }, code: { two: '88', three: '088', eng: 'SHINHAN' }, tossCode: '신한은행' },
    { displayName: { kor: 'SC제일은행', eng: 'Standard Chartered First Bank' }, code: { two: '23', three: '023', eng: 'SC' }, tossCode: 'SC제일' },
    { displayName: { kor: '하나은행', eng: 'Hana Bank' }, code: { two: '81', three: '081', eng: 'HANA' }, tossCode: '하나은행' },
    { displayName: { kor: '우리은행', eng: 'Woori Bank' }, code: { two: '20', three: '020', eng: 'WOORI' }, tossCode: '우리은행' },
    { displayName: { kor: '케이뱅크', eng: 'K Bank' }, code: { two: '89', three: '089', eng: 'KBANK' }, tossCode: '케이뱅크' },
    { displayName: { kor: 'IBK기업은행', eng: 'Industrial Bank of Korea' }, code: { two: '03', three: '003', eng: 'IBK' }, tossCode: '기업은행' },
    { displayName: { kor: '우체국예금보험', eng: 'Postal Savings and Insurance' }, code: { two: '71', three: '071', eng: 'POST' }, tossCode: '우체국' },
    { displayName: { kor: 'Sh수협은행', eng: 'Suhyup Bank' }, code: { two: '07', three: '007', eng: 'SUHYEOP' }, tossCode: '수협은행' },
    { displayName: { kor: '경남은행', eng: 'Kyongnam Bank' }, code: { two: '39', three: '039', eng: 'KYONGNAMBANK' }, tossCode: '경남은행' },
    { displayName: { kor: '부산은행', eng: 'Busan Bank' }, code: { two: '32', three: '032', eng: 'BUSANBANK' }, tossCode: '부산은행' },
    { displayName: { kor: 'DGB대구은행', eng: 'DGB Daegu Bank' }, code: { two: '031', three: '31', eng: 'DAEGUBANK' }, tossCode: '대구은행' },
    { displayName: { kor: '광주은행', eng: 'Gwangju Bank' }, code: { two: '34', three: '034', eng: 'GWANGJUBANK' }, tossCode: '광주은행' },
    { displayName: { kor: '새마을금고', eng: 'The Saemaeul finance firm' }, code: { two: '45', three: '045', eng: 'SAEMAUL' }, tossCode: '새마을' },
    { displayName: { kor: '전북은행', eng: 'Jeonbuk Bank' }, code: { two: '37', three: '037', eng: 'JEONBUKBANK' }, tossCode: '전북은행' }
]
export const Cards: Array<{ displayName: { kor: string, eng: string }, code: { two: string, eng: string }, isOverseas: boolean }> = [
    { displayName: { kor: '신한카드', eng: 'Shinhan Card' }, code: { two: '41', eng: 'SHINHAN' }, isOverseas: false },
    { displayName: { kor: '현대카드', eng: 'Hyundai Card' }, code: { two: '61', eng: 'HYUNDAI' }, isOverseas: false },
    { displayName: { kor: '삼성카드', eng: 'Samsung Card' }, code: { two: '51', eng: 'SAMSUNG' }, isOverseas: false },
    { displayName: { kor: '우리카드', eng: 'Woori Card' }, code: { two: 'W1', eng: 'WOORI' }, isOverseas: false },
    { displayName: { kor: '우리BC카드', eng: 'Woori Card' }, code: { two: '33', eng: 'WOORI' }, isOverseas: false },
    { displayName: { kor: 'KB국민카드', eng: 'KB Kookmin Card' }, code: { two: '11', eng: 'KOOKMIN' }, isOverseas: false },
    { displayName: { kor: '롯데카드', eng: 'LOTTE Card' }, code: { two: '71', eng: 'LOTTE' }, isOverseas: false },
    { displayName: { kor: 'NH농협카드', eng: 'Nonghyeop Card' }, code: { two: '91', eng: 'NONGHYEOP' }, isOverseas: false },
    { displayName: { kor: '하나카드', eng: 'Hana Card' }, code: { two: '21', eng: 'HANA' }, isOverseas: false },
    { displayName: { kor: '비씨카드', eng: 'BC Card' }, code: { two: '31', eng: 'BC' }, isOverseas: false },
    { displayName: { kor: '씨티카드', eng: 'Citibank Card' }, code: { two: '36', eng: 'CITI' }, isOverseas: false },
    { displayName: { kor: '카카오뱅크', eng: 'Kakao Bank' }, code: { two: '15', eng: 'KAKAOBANK' }, isOverseas: false },
    { displayName: { kor: 'KDB산업은행', eng: 'Korea Development Bank' }, code: { two: '30', eng: 'KDBBANK' }, isOverseas: false },
    { displayName: { kor: 'Sh수협은행', eng: 'Suhyup Bank' }, code: { two: '34', eng: 'SUHYEOP' }, isOverseas: false },
    { displayName: { kor: '전북은행', eng: 'Jeonbuk Bank' }, code: { two: '35', eng: 'JEONBUKBANK' }, isOverseas: false },
    { displayName: { kor: '우체국예금보험', eng: 'Postal Savings and Insurance' }, code: { two: '37', eng: 'POST' }, isOverseas: false },
    { displayName: { kor: '새마을금고', eng: 'The Saemaeul finance firm' }, code: { two: '38', eng: 'SAEMAUL' }, isOverseas: false },
    { displayName: { kor: '저축은행중앙회', eng: 'Korea Federation of Savings Bank' }, code: { two: '39', eng: 'SAVINGBANK' }, isOverseas: false },
    { displayName: { kor: '제주은행', eng: 'Jeju Bank' }, code: { two: '42', eng: 'JEJUBANK' }, isOverseas: false },
    { displayName: { kor: '광주은행', eng: 'Gwangju Bank' }, code: { two: '46', eng: 'GWANGJUBANK' }, isOverseas: false },
    { displayName: { kor: '신협', eng: 'Shinhyeop' }, code: { two: '62', eng: 'SHINHYEOP' }, isOverseas: false }
]

function urlEncode (_object: Object) { return Object.keys(_object).map((_data) => encodeURIComponent(_data) + '=' + encodeURIComponent(_object[_data])).join('&') }

export default {
    Payment: {
        Card: {
            process: async function (_id: string & { __brand: 'UUID' }, _card: Card, _customerName: string, _customerEmail: string, _customerMobilePhone: string): Promise<{ success: true, card_company: { kor: string, eng: string }, card_number: string, card_type: TP_CardType, card_owner_type: TP_CardOwnerType, status: PaymentStatus } | { success: false, error?: Error }> {
                try {
                    const _payment = await paymentPlugin.Payment.find(_id)
                    if(_payment.success == false) return { success: false, error: new Error('Failed to fetch payment.', { cause: _payment.error }) }
                    if(_payment.status !== PaymentStatus.PENDING) return { success: false, error: new Error('Payment is in progress or completed.') }
            
                    await getDatabaseClient().manager.getRepository(TossPayments).update({ payment_id: _payment.id, is_active: true }, { is_active: false })
            
                    const _TossPayments = new TossPayments()
                    _TossPayments.payment_id = _payment.id
                    _TossPayments.payment_method = TP_PaymentMethod.카드
                    const _tossPayment = await getDatabaseClient().manager.getRepository(TossPayments).save(_TossPayments)
            
                    const _result = await axios.post(`${ process.env.TOSS_PAYMENTS_CORE_API_ENDPOINT }/v1/payments/key-in`, {
                        amount: _payment.amount.total,
                        orderId: _tossPayment.uuid,
                        orderName: _payment.order.name,
                        customerName: _customerName,
                        taxFreeAmount: _payment.amount.taxFreeAmount,
            
                        cardNumber: _card.card_number,
                        cardExpirationYear: _card.expires_year < 10 ? '0' + String(_card.expires_year) : String(_card.expires_year),
                        cardExpirationMonth: _card.expires_month < 10 ? '0' + String(_card.expires_month) : String(_card.expires_month),
                        customerIdentityNumber: _card.identify_number
                    }, { headers: { authorization: `Basic ${ btoa(`${ process.env.TOSS_PAYMENTS_NORMAL_SECRET }:`) }` } })
                    if(_result.status == 200) {
                        await getDatabaseClient().manager.getRepository(Payment).update({ uuid: _payment.id, is_active: true }, { status: PaymentStatus.DONE, payment_gateway: PaymentGateway.TossPayment })
            
                        const _tossResult: TP_Payment = _result.data
                        const _Transaction = new Transaction()
                        _Transaction.type = TransactionTypes.PAYMENT
                        _Transaction.amount = _tossResult.totalAmount
                        _Transaction.tax_free_amount = _tossResult.taxFreeAmount
                        _Transaction.discount_amount = 0
                        _Transaction.payment_method = PaymentMethod.CARD
                        _Transaction.transaction_key = _tossResult.lastTransactionKey as string
                        _Transaction.payment_id = _payment.id
                        _Transaction.approved_date = new Date(_tossResult.approvedAt)
            
                        const _transaction = await getDatabaseClient().manager.getRepository(Transaction).save(_Transaction)
                        await getDatabaseClient().manager.getRepository(TossPayments).update({ uuid: _tossPayment.uuid }, { payment_key: _tossResult.paymentKey })
            
                        return {
                            success: true,
                            card_company: Cards.filter(function (cardData) { return cardData.code.two == _tossResult.card?.issuerCode })[0].displayName,
                            card_number: _tossResult.card?.number as string,
                            card_type: _tossResult.card?.cardType as TP_CardType,
                            card_owner_type: _tossResult.card?.ownerType as TP_CardOwnerType,
                            status: PaymentStatus.DONE
                        }
                    } else return { success: false, error: new Error('Failed to process payment with card data.') }
                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
            }
        },
        Cultureland: {
            authenticate: async function (_id: string & { __brand: 'UUID' }, _credentials: { username: string, password: string }, ipAddress: string): Promise<{ success: true, culturelandBalance: number } | { success: false, error?: Error }> {
                try {
                    const _payment = await paymentPlugin.Payment.find(_id)
                    if(_payment.success == false) return { success: false, error: new Error('Failed to fetch payment.', { cause: _payment.error }) }
                    if(_payment.status !== PaymentStatus.PENDING) return { success: false, error: new Error('Payment is in progress or completed.') }

                    await getDatabaseClient().manager.getRepository(TossPayments).update({ payment_id: _payment.id, is_active: true }, { is_active: false })

                    const _TossPayments = new TossPayments()
                    _TossPayments.payment_id = _payment.id
                    _TossPayments.payment_method = TP_PaymentMethod.문화상품권
                    const _tossPayments = await getDatabaseClient().manager.getRepository(TossPayments).save(_TossPayments)

                    const _txHeader = `${ process.env.TOSS_PAYMENTS_MERT_MID }-${ '01' }${ _tossPayments.uuid }`
                    const _txId = `${ _txHeader }${ CryptoJS.SHA1(`${ _txHeader }${ utilityPlugin.getRandomStrings(59, '1234567890abcdefghijklnmopqrstuvwxyzABCDEFGHIJKLNMOPQRSTUVWXYZ') }`).toString() }`
                    const _authCode = CryptoJS.SHA1(`${ _txId }${ process.env.TOSS_PAYMENTS_MERT_SECRET }`).toString()

                    const _data = {
                        LGD_TXID: _txId,
                        LGD_AUTHCODE: _authCode,
                        LGD_MID: process.env.TOSS_PAYMENTS_MERT_MID,
                        LGD_TXNAME: 'GiftCulture',
                        LGD_METHOD: 'AUTH',
                        LGD_OID: _payment.id,
                        LGD_AMOUNT: _payment.amount.total,
                        LGD_CULTID: _credentials.username,
                        LGD_CULTPASSWD: _credentials.password,
                        LGD_CULTVERSION: '2',
                        LGD_BUYERID: _payment.id,
                        LGD_PRODUCTINFO: _payment.order.products[0].name + (_payment.order.products.length !== 1 ? ` 외 상품 ${ _payment.order.products.length - 1 }개` : ''),
                        LGD_BUYERIP: ipAddress,
                        LGD_ENCODING: 'UTF-8',
                        LGD_ENCODING_RETURNURL: 'UTF-8'
                    }
                    console.log(_data)
                    console.log(urlEncode(_data))
                    const _result = await axios.post(`${ process.env.TOSS_PAYMENTS_XPAY_API_ENDPOINT }/xpay/Gateway.do`, urlEncode(_data), { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } })
                    if(_result.status == 200) {
                        if(_result.data.LGD_RESPCODE == '0000') {
                            if(_result.data.LGD_RESPONSE[0].LGD_RESPMSG == '인증성공') {
                                await getDatabaseClient().manager.getRepository(TossPayments).update({ uuid: _tossPayments.uuid }, { LGD_TID: _result.data.LGD_RESPONSE[0].LGD_TID, LGD_TXID: _txId })
                                return {
                                    success: true,
                                    culturelandBalance: Number(_result.data.LGD_RESPONSE[0].LGD_CULTBALANCE)
                                }
                            } else return { success: false, error: new Error('An unknown error has occured.') }
                        } else {
                            if(_result.data.LGD_RESPCODE == 'XC01') return { success: false, error: new Error('An unknown error has occured.') }
                            if(_result.data.LGD_RESPCODE == '0803' && _result.data.LGD_RESPONSE[0].LGD_RESPMSG) return { success: false, error: new Error('Wrong username or password.') }
                            return { success: false, error: new Error('Failed to fetch cultureland.') }
                        }
                    } else return { success: false, error: new Error('Failed to fetch cultureland account data.') }
                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
            },
            process: async function (_id: string & { __brand: 'UUID' }): Promise<{ success: true, paymentMethod: PaymentMethod | null, approvedDate: Date, status: PaymentStatus } | { success: false, error?: Error }> {
                try {
                    const _payment = await paymentPlugin.Payment.find(_id)
                    if(_payment.success == false) return { success: false, error: new Error('Failed to fetch payment.', { cause: _payment.error }) }
                    if(_payment.status !== PaymentStatus.PENDING) return { success: false, error: new Error('Payment is in progress or completed.') }

                    const _tossPayments = await getDatabaseClient().manager.getRepository(TossPayments).find({ where: { payment_id: _payment.id, is_active: true } })
                    if(_tossPayments.length !== 1) return { success: false, error: new Error('Cultureland authenticate was required.') }

                    const _data = {
                        LGD_TXID: _tossPayments[0].LGD_TXID,
                        LGD_AUTHCODE: CryptoJS.SHA1(`${ _tossPayments[0].LGD_TXID }${ process.env.TOSS_PAYMENTS_MERT_SECRET }`).toString(),
                        LGD_MID: process.env.TOSS_PAYMENTS_MERT_MID,
                        LGD_TXNAME: 'GiftCulture',
                        LGD_METHOD: 'APP',
                        LGD_TID: _tossPayments[0].LGD_TID,
                        LGD_AMOUNT: _payment.amount.total,
                        LGD_ENCODING: 'UTF-8',
                        LGD_ENCODING_RETURNURL: 'UTF-8'
                    }
                    const _result = await axios.post(`${ process.env.TOSS_PAYMENTS_XPAY_API_ENDPOINT }/xpay/Gateway.do`, urlEncode(_data), { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } })
                    if(_result.status == 200) {
                        if(_result.data.LGD_RESPCODE == '0000') {
                            if(_result.data.LGD_RESPONSE[0].LGD_RESPMSG == '결제성공') {
                                await getDatabaseClient().manager.getRepository(Payment).update({ uuid: _payment.id, is_active: true }, { status: PaymentStatus.DONE, payment_gateway: PaymentGateway.TossPayment })

                                const _Transaction = new Transaction()
                                _Transaction.type = TransactionTypes.PAYMENT
                                _Transaction.amount = Number(_result.data.LGD_RESPONSE[0].LGD_AMOUNT)
                                _Transaction.tax_free_amount = _payment.amount.taxFreeAmount
                                _Transaction.discount_amount = 0
                                _Transaction.payment_method = PaymentMethod.CULTURELAND
                                _Transaction.transaction_key = _result.data.LGD_RESPONSE[0].LGD_HASHDATA
                                _Transaction.payment_id = _payment.id
                                _Transaction.approved_date = new Date(`${ _result.data.LGD_RESPONSE[0].LGD_TIMESTAMP.substr(0, 4) }-${ _result.data.LGD_RESPONSE[0].LGD_TIMESTAMP.substr(4, 2) }-${ _result.data.LGD_RESPONSE[0].LGD_TIMESTAMP.substr(6, 2) }T${ _result.data.LGD_RESPONSE[0].LGD_TIMESTAMP.substr(8, 2) }:${ _result.data.LGD_RESPONSE[0].LGD_TIMESTAMP.substr(10, 2) }:${ _result.data.LGD_RESPONSE[0].LGD_TIMESTAMP.substr(12, 2) }+09:00`)
                                
                                const _transaction = await getDatabaseClient().manager.getRepository(Transaction).save(_Transaction)
            
                                return {
                                    success: true,
                                    paymentMethod: _transaction.payment_method,
                                    approvedDate: _transaction.approved_date,
                                    status: PaymentStatus.DONE
                                }
                            } else return { success: false, error: new Error('An unknown error has occured.') }
                        } else {
                            if(_result.data.LGD_RESPCODE == 'XC01') return { success: false, error: new Error('An unknown error has occured.') }
                            return { success: false, error: new Error('Failed to fetch cultureland.') }
                        }
                    } else return { success: false, error: new Error('Failed to fetch cultureland account data.') }

                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
            }
        },
        process: async (
            _id: string & { __brand: 'UUID' },
            _paymentKey: string,
            _processId: string & { __brand: 'UUID' }
        ): Promise<
            { success: true, paymentMethod: PaymentMethod | null, approvedDate: Date, status: PaymentStatus }
            | { success: false, error?: Error }
        > => {
            try {
                const _payment = await paymentPlugin.Payment.find(_id)
                if(_payment.success == false) return { success: false, error: new Error('Failed to fetch payment.', { cause: _payment.error }) }
                if(_payment.status !== PaymentStatus.PENDING) return { success: false, error: new Error('Payment is in progress or completed.') }
        
                const _tossPayments = await getDatabaseClient().manager.getRepository(TossPayments).find({ where: { uuid: _processId, payment_id: _payment.id, is_active: true } })
                if(_tossPayments.length !== 1) return { success: false, error: new Error('Wrong process id.') }
        
                const _result = await axios.post(`${ process.env.TOSS_PAYMENTS_CORE_API_ENDPOINT }/v1/payments/confirm`, {
                    amount: _payment.amount.total,
                    orderId: _tossPayments[0].uuid,
                    paymentKey: _paymentKey
                }, { headers: { authorization: `Basic ${ btoa(`${ process.env.TOSS_PAYMENTS_NORMAL_SECRET }:`) }` } })
                if(_result.status == 200) {
                    const _tossResult = _result.data as TP_Payment
                    await getDatabaseClient().manager.getRepository(Payment).update({ uuid: _payment.id, is_active: true }, { status: PaymentStatus.DONE, payment_gateway: PaymentGateway.TossPayment })
                    await getDatabaseClient().manager.getRepository(TossPayments).update({ uuid: _tossPayments[0].uuid, is_active: true }, { payment_key: _tossResult.paymentKey, payment_method: _tossResult.method })
        
                    const _Transaction = new Transaction()
                    _Transaction.type = TransactionTypes.PAYMENT
                    _Transaction.amount = _payment.amount.total
                    _Transaction.tax_free_amount = _payment.amount.taxFreeAmount
                    _Transaction.discount_amount = 0
        
                    switch (_tossResult.method) {
                        case TP_PaymentMethod.가상계좌:
                            _Transaction.payment_method = PaymentMethod.VIRTUAL_ACCOUNT
                            _Transaction.bank_code = _tossResult.virtualAccount?.bankCode as string
                            break
                        case TP_PaymentMethod.문화상품권:
                            _Transaction.payment_method = PaymentMethod.CULTURELAND
                            _Transaction.approve_number = _tossResult.giftCertificate?.approveNo as string
                            break
                        case TP_PaymentMethod.계좌이체:
                            _Transaction.payment_method = PaymentMethod.TRANSFER
                            _Transaction.bank_code = _tossResult.transfer?.bankCode as string
                            break
                        case TP_PaymentMethod.카드:
                            _Transaction.payment_method = PaymentMethod.CARD
                            _Transaction.card_company = _tossResult.card?.issuerCode as string
                            switch (_tossResult.card?.ownerType) {
                                case TP_CardOwnerType.개인:
                                    _Transaction.card_owner_type = CardOwnerTypes.INDIVIDUAL
                                    break
                                case TP_CardOwnerType.법인:
                                    _Transaction.card_owner_type = CardOwnerTypes.CORPORATION
                                    break
                                case TP_CardOwnerType.미확인:
                                    _Transaction.card_owner_type = CardOwnerTypes.UNIDENTIFIED
                                    break
                            }
                            switch (_tossResult.card?.cardType) {
                                case TP_CardType.기프트:
                                    _Transaction.card_type = CardTypes.GIFT
                                    break
                                case TP_CardType.신용:
                                    _Transaction.card_type = CardTypes.CREDIT
                                    break
                                case TP_CardType.체크:
                                    _Transaction.card_type = CardTypes.DEBIT
                                    break
                                case TP_CardType.미확인:
                                    _Transaction.card_type = CardTypes.UNIDENTIFIED
                                    break
                            }
                            break
                    }
                    _Transaction.transaction_key = _tossResult.lastTransactionKey as string
                    _Transaction.payment_id = _payment.id
                    _Transaction.approved_date = new Date(_tossResult.approvedAt)
        
                    const _transaction = await getDatabaseClient().manager.getRepository(Transaction).save(_Transaction)
        
                    return {
                        success: true,
                        paymentMethod: _transaction.payment_method,
                        approvedDate: _transaction.approved_date,
                        status: PaymentStatus.DONE
                    }
                } else return { success: false, error: new Error('Failed to process payment with payment key.') }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        VirtualAccount: {
            issue: async (_id: string & { __brand: 'UUID' }, _customerName: string, _customerEmail: string, _customerMobilePhone: string, _cashReceipt: { type: TP_CashReceiptType, registrationNumber?: string }, _bank: string, _validHours: number = 168): Promise<{ success: true, id: string, accountNumber: string, bank: { kor: string, eng: string }, expiresDate: Date, status: VirtualAccountStatus } | { success: false, error?: Error }> => {
                try {
                    const _payment = await paymentPlugin.Payment.find(_id)
                    if(_payment.success == false) return { success: false, error: new Error('Failed to fetch payment.', { cause: _payment.error }) }
                    if(_payment.status !== PaymentStatus.PENDING) return { success: false, error: new Error('Payment is in progress or completed.') }
            
                    await getDatabaseClient().manager.getRepository(TossPayments).update({ payment_id: _payment.id, is_active: true }, { is_active: false })
            
                    const _TossPayments = new TossPayments()
                    _TossPayments.payment_id = _payment.id
                    _TossPayments.payment_method = TP_PaymentMethod.가상계좌
                    const _tossPayments = await getDatabaseClient().manager.getRepository(TossPayments).save(_TossPayments)
            
                    const _result = await axios.post(`${ process.env.TOSS_PAYMENTS_CORE_API_ENDPOINT }/v1/virtual-accounts`, {
                        amount: _payment.amount.total,
                        orderId: _tossPayments.uuid,
                        orderName: _payment.order.name,
                        customerName: _customerName,
                        bank: _bank,
                        validHours: _validHours,
                        taxFreeAmount: _payment.amount.taxFreeAmount
                    }, { headers: { authorization: `Basic ${ btoa(`${ process.env.TOSS_PAYMENTS_NORMAL_SECRET }:`) }` } })
                    if(_result.status == 200) {
                        const _tossResult = _result.data as TP_Payment
                        await getDatabaseClient().manager.getRepository(Payment).update({ uuid: _payment.id, is_active: true }, { status: PaymentStatus.WAITING, payment_gateway: PaymentGateway.TossPayment })

                        const _VirtualAccounts = new VirtualAccount()
                        _VirtualAccounts.account_number = _tossResult.virtualAccount?.accountNumber as string
                        _VirtualAccounts.account_type = VirtualAccountTypes.NORMAL
                        _VirtualAccounts.bank_code = _tossResult.virtualAccount?.bankCode as string
                        _VirtualAccounts.due_date = new Date(_tossResult.virtualAccount?.dueDate as string)
                        _VirtualAccounts.payment_id = _payment.id
                        _VirtualAccounts.secret = _tossResult.secret as string
                        if(_cashReceipt.type !== TP_CashReceiptType.미발행) {
                            _VirtualAccounts.cash_receipt_type = _cashReceipt.type
                            _VirtualAccounts.registration_number = _cashReceipt.registrationNumber as string
                        }
            
                        _VirtualAccounts.customer_name = _customerName
                        _VirtualAccounts.customer_phone = _customerMobilePhone
                        _VirtualAccounts.customer_email = _customerEmail
            
                        // const _Notification = new Notification()
                        // await _Notification.send([ { phoneNumber: _customerMobilePhone, content: `[Luna Payments] 가상계좌 안내\n${ _customerName }님의 가상계좌는 ${ banks.filter(function (_bank) { return _bank.code.two == _tossResult.virtualAccount?.bankCode })[0].displayName.ko } ${ _tossResult.virtualAccount?.accountNumber } 입니다.` } ])
            
                        const _virtualAccounts = await getDatabaseClient().manager.getRepository(VirtualAccount).save(_VirtualAccounts)
            
                        return {
                            success: true,
                            id: _virtualAccounts.uuid,
                            accountNumber: _virtualAccounts.account_number,
                            bank: Banks.filter(function (_bank) { return _bank.code.two == _tossResult.virtualAccount?.bankCode })[0].displayName,
                            expiresDate: new Date(_tossResult.virtualAccount?.dueDate as string),
                            status: _virtualAccounts.status
                        }
                    } else return { success: false, error: new Error('An unknown error has occured.') }
                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
            }
        }
    }
}