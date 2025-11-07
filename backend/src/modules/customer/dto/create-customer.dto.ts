import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  kvkNumber?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;
}

