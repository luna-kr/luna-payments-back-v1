import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum TransferType { 적립 = '적립', Charge = 'Charge', Use = 'Use', Expire = 'Expire' }

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'enum', enum: TransferType, nullable: false, comment: 'Transfer type' })
    type: TransferType

    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Send wallet UUID' })
    send_wallet_id: string | null

    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Received wallet UUID' })
    received_wallet_id: string | null

    @Column({ type: 'int', nullable: false, comment: 'Transfer amount' })
    amount: number

    @Column({ type: 'text', nullable: false, comment: 'Transfer label' })
    label: string

    @Column({ type: 'text', nullable: false, comment: 'System remark' })
    remark: string


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}