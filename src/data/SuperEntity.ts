import { BaseEntity, CreateDateColumn } from "typeorm";

export class SuperEntity extends BaseEntity {
    
    @CreateDateColumn ({type: 'datetime'})
    created: Date

    @CreateDateColumn  ({type: "datetime", nullable: true})
    updated: Date

}