import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { TP_CardOwnerType } from './TossPayment.entity'

export enum PaymentMethod { CARD = 'CARD' /* 신용/체크 카드 */, VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT' /* 가상계좌 (무통장입금) */, TRANSFER = 'TRANSFER' /* 계좌이체 */, CULTURELAND = 'CULTURELAND' /* 컬쳐랜드 문화상품권 */, MOBILE = 'MOBILE' /* 휴대폰 소액결제 */, EASY_PAY = 'EASY_PAY' /* 간편 결제 */ }
export enum OrderType { NORMAl = 'NORMAL' /* 일반 결제 */, BILLING = 'BILLING' /* 정기 결제 */, LUNA_PAY = 'LUNA_PAY' /* 루나 간편 결제 */ }
export enum Currency { KRW = 'KRW', USD = 'USD', JPY = 'JPY', CNY = 'CNY', EUR = 'EUR' }
export enum PaymentStatus { PENDING = 'PENDING' /* 결제 대기 */, PROGRESS = 'PROGRESS' /* 결제중 */, WAITING = 'WAITING' /* 입금 대기 */, DONE = 'DONE' /* 결제 완료 */, CANCELED = 'CANCELED' /* 결제 취소 */, PARTIAL_CANCELED = 'PARTIAL_CANCELED' /* 결제 부분 취소 */, EXPIRED = 'EXPIRED' /* 결제 만료 */, FAILURE = 'FAILURE' /* 결제 실패 */ }
export enum PaymentGateway { TossPayment = 'TossPayment' }

export interface Card {
    card_number: string,

    expires_year: number,
    expires_month: number,

    password?: string,

    type: TP_CardOwnerType,
    identify_number: string
}

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Payment UUID' })
    uuid: string & { __brand: 'UUID' }

    @Column({ type: 'enum', enum: OrderType, nullable: false, default: OrderType.NORMAl, comment: 'Order Type' })
    order_type: OrderType

    @Column({ type: 'text', nullable: false, comment: 'Order Name' })
    order_name: string

    @Column({ type: 'text', nullable: false, comment: 'Order ID' })
    order_id: string

    @Column({ type: 'json', nullable: false, comment: 'Products information' })
    products: Array<{
        name: string,
        price: number
    }>

    @Column({ type: 'enum', enum: Currency, nullable: false, default: Currency.KRW, comment: 'Currency' })
    currency: Currency

    @Column({ type: 'enum', enum: PaymentGateway, nullable: true, default: null, comment: 'Payment gateway' })
    payment_gateway: PaymentGateway | null


    /* Amount */
        @Column({ type: 'int', nullable: false, comment: 'Total amount of Payment' })
        total_amount: number

        @Column({ type: 'int', nullable: false, comment: 'Supplied amount of Payment' })
        supplied_amount: number

        @Column({ type: 'int', nullable: false, comment: 'Tax free amount' })
        tax_free: number


    /* Tax of Payments */
        @Column({ type: 'int', nullable: false, comment: 'VAT amount' })
        vat: number


    /* Cancel data */
        @Column({ type: 'boolean', nullable: false, default: true, comment: 'Partial cancelable' })
        partial_cancelable: boolean
        
        @Column({ type: 'int', nullable: true, default: null, comment: 'Canceled amount' })
        canceled_amount: number | null


    /* Verification data */
        @Column({ type: 'varchar', length: 50, nullable: false, comment: 'Verification secret key / by Market' })
        secret: string

        @Column({ type: 'char', length: 64, nullable: false, comment: 'Verification token / by Luna Payments' })
        token: string
    
    /* Customer information */
        @Column({ type: 'varchar', length: 10, nullable: true, default: null, comment: 'Customer full name' })
        full_name: string

        @Column({ type: 'varchar', length: 30, nullable: true, default: null, comment: 'Customer phone number' })
        phone_number: string

        @Column({ type: 'varchar', length: 50, nullable: true, default: null, comment: 'Customer email address' })
        email_address: string


    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING, comment: 'Payment Status' })
    status: PaymentStatus

    @Column({ type: 'text', nullable: true, default: null, comment: 'Payment remark' })
    remark: string | null

    @Column({ type: 'uuid', nullable: false, comment: 'Application UUID' })
    application_id: string

    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @Column({ type: 'timestamptz', nullable: false, comment: 'Expires date' })
    expires_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Approve date' })
    approved_date: Date | null

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}
