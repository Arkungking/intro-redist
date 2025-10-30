import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";
import { TransactionStatus } from "../../../generated/prisma";

export class GetBlogsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search: string = "";
}
