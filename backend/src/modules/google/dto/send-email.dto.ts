import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsOptional()
  @IsEmail(undefined, { each: true })
  cc?: string[];

  @IsOptional()
  @IsEmail(undefined, { each: true })
  bcc?: string[];

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

