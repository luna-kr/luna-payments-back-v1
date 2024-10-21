import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PaymentMethod } from './Payment.entity'

@Entity()
export class Promotion {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }

    
    @Column({ type: 'varchar', length: 30, nullable: true, default: null, comment: 'Coupon code' })
    code: string | null

    @Column({ type: 'text', nullable: false, comment: 'Promotion name' })
    name: string

    @Column({ type: 'text', nullable: false, comment: 'Promotion description' })
    description: string

    @Column({ type: 'int', nullable: true, default: null, comment: 'Discount percent' })
    percent: number | null

    @Column({ type: 'int', nullable: true, default: null, comment: 'Discount amount' })
    discount: number | null


    @Column({ type: 'int', nullable: true, default: null, comment: 'Discount condition (minimum amount)' })
    minimum_amount: number | null

    @Column({ type: 'int', nullable: true, default: null, comment: 'Discount condition (maximum amount)' })
    maximum_amount: number | null

    @Column({ type: 'enum', enum: PaymentMethod, array: true, nullable: false, default: new Array(), comment: 'Method condition (payment method)' })
    payment_method: Array<PaymentMethod>

    @Column({ type: 'uuid', nullable: false, comment: 'Application UUID' })
    application_id: string


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}