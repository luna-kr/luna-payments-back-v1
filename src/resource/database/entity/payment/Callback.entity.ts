import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Callback {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }

    
    @Column({ type: 'text', nullable: false, comment: 'Callback URI' })
    uri: string

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
