import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PaymentMethod } from './Payment.entity'

@Entity()
export class Cancel {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }

    
    @Column({ type: 'int', nullable: false, comment: 'Canceled total amount' })
    amount: number

    @Column({ type: 'int', nullable: false, comment: 'Tax free amount of canceled' })
    tax_free_amount: number

    @Column({ type: 'int', nullable: false, comment: 'Discount amount of canceled' })
    discount_amount: number

    @Column({ type: 'varchar', length: 200, nullable: false, comment: 'Cancel reason' })
    cancel_reason: string


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
