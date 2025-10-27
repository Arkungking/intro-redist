import { IsNotEmpty, IsUUID } from "class-validator";

export class UplaodPaymentProofDTO {
  @IsNotEmpty()
  @IsUUID()
  uuid!: string;
}
