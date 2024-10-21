import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PaymentMethod } from './Payment.entity'
import { VirtualAccountTypes } from './VirtualAccount.entity'

export enum TransactionTypes { PAYMENT = 'PAYMENT' /* 결제 거래 */, CANCEl = 'CANCEL' /* 취소 거래 */ }
export enum CardTypes { CREDIT = 'CREDIT' /* 신용 카드 */, DEBIT = 'DEBIT' /* 체크 카드 */, PREPAID = 'PREPAID' /* 선불 카드 */, GIFT = 'GIFT' /* 기프트 카드 */, UNIDENTIFIED = 'UNIDENTIFIED' }
export enum CardOwnerTypes { INDIVIDUAL = 'INDIVIDUAL' /* 개인 */, CORPORATION = 'CORPORATION' /* 법인 */, UNIDENTIFIED = 'UNIDENTIFIED' }

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'enum', enum: TransactionTypes, nullable: false, comment: 'Transaction type' })
    type: TransactionTypes
    
    
    @Column({ type: 'int', nullable: false, comment: 'Processed amount' })
    amount: number

    @Column({ type: 'int', nullable: true, default: null, comment: 'Tax free amount of processed' })
    tax_free_amount: number | null

    @Column({ type: 'int', nullable: true, default: null, comment: 'Discount amount of processed' })
    discount_amount: number | null


    @Column({ type: 'enum', enum: PaymentMethod, nullable: false, comment: 'Payment method' })
    payment_method: PaymentMethod

    @Column({ type: 'text', nullable: false, comment: 'Transaction key issued by PG' })
    transaction_key: string

    @Column({ type: 'timestamptz', nullable: false, comment: 'Approved date' })
    approved_date: Date

    /* Card and Cultureland */
        @Column({ type: 'varchar', length: 8, nullable: true, default: null, comment: 'Card or Cultureland approve number' })
        approve_number: string | null
        

    /* Card */
        @Column({ type: 'char', length: 19, nullable: true, default: null, comment: 'Card number' })
        card_number: string | null

        @Column({ type: 'varchar', length: 50, nullable: true, default: null, comment: 'Card company' })
        card_company: string | null

        @Column({ type: 'enum', enum: CardTypes, nullable: true, default: null, comment: 'Card type' })
        card_type: CardTypes | null

        @Column({ type: 'int', nullable: true, default: null, comment: 'Installment plan (month)' })
        installment_plan: number | null

        @Column({ type: 'enum', enum: CardOwnerTypes, nullable: true, default: null, comment: 'Card owner type' })
        card_owner_type: CardOwnerTypes | null


    /* Virtual Account and Transfer */
        @Column({ type: 'varchar', length: 30, nullable: true, default: null, comment: 'Bank code' })
        bank_code: string | null


    /* Virtual Account */
        @Column({ type: 'enum', enum: VirtualAccountTypes, nullable: true, default: null, comment: 'Account type' })
        account_type: VirtualAccountTypes | null

        @Column({ type: 'varchar', length: 20, nullable: true, default: null, comment: 'Account number' })
        account_number: string | null

        @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Deposit deadline' })
        due_date: Date | null

        @Column({ type: 'uuid', nullable: true, default: null, comment: 'Virtual account UUID' })
        virtual_account_id: string | null


    @Column({ type: 'uuid', nullable: false, comment: 'Payment UUID' })
    payment_id: string


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}
