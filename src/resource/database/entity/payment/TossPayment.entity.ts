import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum TP_PaymentType { NORMAL = 'NORMAL', BILLING = 'BILLING', BRANDPAY = 'BRANDPAY' }
export enum TP_PaymentMethod { 카드 = '카드', 가상계좌 = '가상계좌', 간편결제 = '간편결제', 휴대폰 = '휴대폰', 계좌이체 = '계좌이체', 문화상품권 = '문화상품권', 도서문화상품권 = '도서문화상품권', 게임문화상품권 = '게임문화상품권' }
export enum TP_PaymentStatus { READY = 'READY', IN_PROGRESS = 'IN_PROGRESS', WAITING_FOR_DEPOSIT = 'WAITING_FOR_DEPOSIT', DONE = 'DONE', CANCELED = 'CANCELED', PARTIAL_CANCELED = 'PARTIAL_CANCELED', ABORTED = 'ABORTED', EXPIRED = 'EXPIRED' }

export enum TP_CardType { 신용 = '신용', 체크 = '체크', 기프트 = '기프트', 미확인 = '미확인' }
export enum TP_CardOwnerType { 개인 = '개인', 법인 = '법인', 미확인 = '미확인' }
export enum TP_AcquireStatus { READY = 'READY', REQUESTED = 'REQUESTED', COMPLETED = 'COMPLETED', CANCEL_REQUESTED = 'CANCEL_REQUESTED', CANCELED = 'CANCELED' }
export enum TP_InterestPayerType { BUYER = 'BUYER', CARD_COMPANY = 'CARD_COMPANY', MERCHANT = 'MERCHANT' }

export enum TP_AccountType { 일반 = '일반', 고정 = '고정' }
export enum TP_RefundStatus { NONE = 'NONE', PENDING = 'PENDING', FAILED = 'FAILED', PARTIAL_FAILED = 'PARTIAL_FAILED', COMPLETED = 'COMPLETED' }
export enum TP_SettlementStatu { INCOMPLETED = 'INCOMPLETED', COMPLETED = 'COMPLETED' }
export enum TP_CashReceiptType { 소득공제, 지출증빙, 미발행 }
export enum TP_CashReceiptsType { 소득공제 = '소득공제', 지출증빙 = '지출증빙' }
export enum TP_CashReceipt_TransactionType { CONFIRM = 'CONFIRM', CANCEL = 'CANCEL' }
export enum TP_CashReceipt_IssueStatus { IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', FAILED = 'FAILED' }

export interface TP_Payment {
    identify: boolean | null | undefined,

    version: string,
    paymentKey: string,
    type: TP_PaymentType,
    orderId: string,
    orderName: string,
    mId: string,
    currency: string,
    method: TP_PaymentMethod,
    totalAmount: number,
    balanceAmount: number,
    status: TP_PaymentStatus,
    requestedAt: string, // yyyy-MM-dd'T'HH:mm:ss±hh:mm
    approvedAt: string, // yyyy-MM-dd'T'HH:mm:ss±hh:mm
    useEscrow: boolean,
    lastTransactionKey: string | null,
    suppliedAmount: number,
    vat: number,
    cultureExpense: boolean,
    taxFreeAmount: number,
    taxExemptionAmount: number,
    cancels: Array<{
        cancelAmount: number,
        cancelReason: string,
        taxFreeAmount: number,
        taxExemptionAmount: number,
        refundableAmount: number,
        easyPayDiscountAmount: number,
        canceledAt: string, // yyyy-MM-dd'T'HH:mm:ss±hh:mm
        transactionKey: string,
        receiptKey: string
    }> | null,
    isPartialCancelable: boolean,
    card: {
        amount: number,
        issuerCode: string,
        acquirerCode: string | null,
        number: string,
        installmentPlanMonths: number,
        approveNo: string,
        useCardPoint: boolean,
        cardType: TP_CardType,
        ownerType: TP_CardOwnerType,
        acquireStatus: TP_AcquireStatus,
        isInterestFree: boolean,
        interestPayer: TP_InterestPayerType | null
    } | null,
    virtualAccount: {
        accountType: TP_AccountType,
        accountNumber: string,
        bankCode: string,
        bank: string,
        customerName: string,
        dueDate: string,
        refundStatus: TP_RefundStatus,
        expired: boolean,
        settlementStatus: TP_SettlementStatu,
        refundReceiveAccount: {
            bankCode: string,
            accountNumber: string,
            holderName: string
        } | null
    } | null,
    secret: string | null,
    mobilePhone: {
        customerMobilePhone: string,
        settlementStatus: TP_SettlementStatu,
        receiptUrl: string
    } | null,
    giftCertificate: {
        approveNo: string,
        settlementStatus: TP_SettlementStatu
    } | null,
    transfer: {
        bankCode: string,
        settlementStatus: TP_SettlementStatu
    } | null,
    receipt: {
        url: string
    } | null,
    checkout: {
        url: string
    } | null,
    easyPay: {
        provider: string,
        amount: number,
        discountAmount: number
    } | null,
    country: string,
    failure: {
        code: string,
        message: string
    } | null,
    cashReceipt: {
        type: TP_CashReceiptType,
        receiptKey: string,
        issueNumber: string,
        receiptUrl: string,
        amount: number,
        taxFreeAmount: number
    } | null,
    cashReceipts: Array<{
        receiptKey: string,
        orderId: string,
        orderName: string,
        type: TP_CashReceiptsType,
        issueNumber: string,
        receiptUrl: string,
        businessNumber: string,
        transactionType: TP_CashReceipt_TransactionType,
        amount: number,
        taxFreeAmount: number,
        issueStatus: TP_CashReceipt_IssueStatus,
        failure: {
            code: string,
            message: string
        } | null,
        customerIdentityNumber: string,
        requestedAt: string // yyyy-MM-dd'T'HH:mm:ss±hh:mm
    }> | null,
    discount: {
        amount: number
    } | null
}

@Entity()
export class TossPayments {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }

    
    @Column({ type: 'text', nullable: true, default: null, comment: 'TossPayments Payment key' })
    payment_key: string | null
    
    @Column({ type: 'enum', enum: TP_PaymentMethod, nullable: true, default: null, comment: 'TossPayments Payment Method' })
    payment_method: TP_PaymentMethod
    
    
    @Column({ type: 'uuid', nullable: false, comment: 'Payment UUID' })
    payment_id: string
    
    @Column({ type: 'text', nullable: true, default: null, comment: 'Cultureland TXID' })
    LGD_TXID: string | null
    
    @Column({ type: 'text', nullable: true, default: null, comment: 'Cultureland TID' })
    LGD_TID: string | null


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}