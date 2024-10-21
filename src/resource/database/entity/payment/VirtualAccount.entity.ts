import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { TP_CashReceiptType } from './TossPayment.entity'

export enum VirtualAccountTypes { NORMAL = 'NORMAL' /* 일반 계좌 */, FIXED = 'FIXED' /* 고정 계좌 */ }
export enum VirtualAccountStatus { WAITING = 'WAITING' /* 입금 대기 */, DONE = 'DONE' /* 결제 완료 */, EXPIRED = 'EXPIRED' /* 만료 */, REFUND = 'REFUND' /* 환불 */ }


@Entity()
export class VirtualAccount {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'enum', enum: VirtualAccountTypes, nullable: false, comment: 'Account type' })
    account_type: VirtualAccountTypes

    @Column({ type: 'varchar', length: 20, nullable: false, comment: 'Account number' })
    account_number: string

    @Column({ type: 'varchar', length: 30, nullable: false, comment: 'Bank code' })
    bank_code: string

    @Column({ type: 'timestamptz', nullable: false, comment: 'Deposit deadline' })
    due_date: Date

    @Column({ type: 'varchar', length: 50, nullable: false, comment: 'PG Secret' })
    secret: string


    @Column({ type: 'enum', enum: TP_CashReceiptType, nullable: false, default: TP_CashReceiptType.미발행, comment: 'Cash receipt type' })
    cash_receipt_type: TP_CashReceiptType

    @Column({ type: 'text', nullable: true, default: null, comment: 'Cash receipt registration number' })
    registration_number: string

    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Cash receipt UUID' })
    cash_receipt_id: string


    @Column({ type: 'varchar', length: 30, nullable: false, comment: 'Customer name' })
    customer_name: string

    @Column({ type: 'varchar', length: 30, nullable: false, comment: 'Customer phone number' })
    customer_phone: string

    @Column({ type: 'varchar', length: 100, nullable: false, comment: 'Customer email address' })
    customer_email: string


    @Column({ type: 'uuid', nullable: false, comment: 'Payment UUID' })
    payment_id: string


    @Column({ type: 'enum', enum: VirtualAccountStatus, default: VirtualAccountStatus.WAITING, comment: 'Process status' })
    status: VirtualAccountStatus


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}