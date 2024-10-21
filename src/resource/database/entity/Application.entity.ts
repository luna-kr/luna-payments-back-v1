import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PaymentMethod } from './payment/Payment.entity'

export enum ApplicationStatus { Pending = 'Pending' /* 승인 대기 */, Normal = 'Normal' /* 정상 */, Blocked = 'Blocked' /* 결제 정지 */, Suspended = 'Suspended' /* 정산 중지 */, Terminated = 'Terminated' /* 계약 해지 */}

@Entity()
export class Application {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'text', nullable: false, comment: 'Application name' })
    name: string

    @Column({ type: 'text', nullable: false, comment: 'Application description' })
    description: string

    @Column({ type: 'text', nullable: false, comment: 'Application homepage URI' })
    homepage_uri: string

    @Column({ type: 'text', nullable: false, comment: 'Terms URI' })
    terms_uri: string

    @Column({ type: 'text', nullable: false, comment: 'Privacy URI' })
    privacy_uri: string


    @Column({ type: 'text', nullable: false, comment: 'Private key' })
    private_key: string

    @Column({ type: 'uuid', array: true, nullable: true, default: null, comment: 'Managers UUID' })
    manager_id: Array<string>

    @Column({ type: 'text', array: true, default: new Array(), comment: 'Webhook URIs' })
    webhook_uris: Array<string>

    @Column({ type: 'text', nullable: false, comment: 'Emergency contact information (Phone number)' })
    phone_number: string

    @Column({ type: 'text', nullable: false, comment: 'Korea business registeration number' })
    business_registration_number: string

    @Column({ type: 'text', nullable: false, comment: 'Company name' })
    business_type: 'individual' | 'corporation'

    @Column({ type: 'text', nullable: false, comment: 'Taxation type' })
    taxation_type: 'general' | 'simplicity' | 'tax-free'

    @Column({ type: 'text', nullable: false, comment: 'Company name' })
    company_name: string

    @Column({ type: 'text', nullable: false, comment: 'Company representative' })
    representative: string

    @Column({ type: 'text', nullable: false, comment: 'Business address' })
    address: string


    @Column({ type: 'int', nullable: false, default: 0, comment: 'Monthly settlement limit' })
    settlement_limit: number

    @Column({ type: 'jsonb',  nullable: false, default: new Array(), comment: 'Allowed payment method' })
    payment_methods: Array<{
        payment_method: PaymentMethod,
        status: 'Applied' | 'Reviewing' | 'Actived' | 'Suspended' | 'Terminated',
        added_date: Date,
        reviewed_date?: Date,
        terminated_date?: Date
    }>

    @Column({ type: 'jsonb', nullable: false, default: new Array(), comment: 'History' })
    history: Array<
        { type: 'STATUS', new_status: ApplicationStatus, remark?: string, occured_date: Date }
        | { type: 'PAYMENT_METHOD', id: string, user_id: string, occured_date: Date }
        | { type: 'PAYMENT_METHOD_STATUS', payment_method: PaymentMethod, new_status: 'Applied' | 'Reviewing' | 'Actived' | 'Suspended' | 'Terminated', remark?: string, occured_date: Date }
    >


    @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.Pending, comment: 'Application state' })
    status: ApplicationStatus

    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}
