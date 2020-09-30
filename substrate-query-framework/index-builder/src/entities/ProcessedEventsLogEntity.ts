import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({
  name: 'processed_events_log'
})
export class ProcessedEventsLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // Processor name, e.g. 'hydra-tutorial' 
  @Column()
  processor!: string;

  // the indexed event reference
  @Column()
  @Index()
  eventId!: string;

  // When the event is added to the database
  @Column('timestamp without time zone', {
    default: () => 'now()',
  })
  updatedAt!: Date;
}