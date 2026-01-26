import { Module } from "@nestjs/common";
import { FirebaseModule } from "../shared/firebase/firebase.module";

@Module({
    imports: [FirebaseModule],
    controllers: [],
    providers: [],
    exports: [],
})
export class ReportsModule { }