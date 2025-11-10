import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY } from "../../domain/repositories/user.repository.interface";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { CreateUserDto, UserDto, UserFilterDto, UserUpdateAdminDto, UserUpdateDto } from "../dto/user.dto";
import { CreateUserUseCase } from "../use-cases/create-user.use-case";
import { toUserDTO } from "../dto/user-dto.mapper";
import { PagedResult } from "src/shared/models/paged-result";
import { BaseFilter } from "src/shared/models/base-filter-props";
import { UserFilterProps } from "../../domain/model/user.model";
import { UpdateUserUseCase } from "../use-cases/update-user.use-case";
import { Role } from "../../domain/model/role.model";
import { PhoneNumber } from "../../domain/model/phone-number.vo";
import { Address } from "../../domain/model/address.model";
import { Link, LinkType } from "../../domain/model/link.model";
import { AssignRoleUseCase } from "../use-cases/assign-role.use-case";


@Injectable()
export class UserService {


    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly createUseCase: CreateUserUseCase,
        private readonly updateUseCase: UpdateUserUseCase,
        private readonly assignRoleUseCase: AssignRoleUseCase,
    ) { }

    async list(filterDto: BaseFilter<UserFilterDto>): Promise<PagedResult<UserDto>> {
        const filter: BaseFilter<UserFilterProps> = {
            pageIndex: filterDto.pageIndex,
            pageSize: filterDto.pageSize,
            props: {
                email: filterDto.props?.email,
                status: filterDto.props?.status,
                firstName: filterDto.props?.firstName,
                lastName: filterDto.props?.lastName,
                roleCode: filterDto.props?.roleCode,
                phoneNumber: filterDto.props?.phoneNumber
            }
        }
        const users = await this.userRepository.findPaged(filter);
        return new PagedResult(users.items.map(toUserDTO), users.total, users.page, users.size);
    }


    async getById(id: string): Promise<UserDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User not found with id ' + id);
        }
        return toUserDTO(user);
    }

    async create(request: CreateUserDto): Promise<UserDto> {
        const newUser = await this.createUseCase.execute(request);
        return toUserDTO(newUser);
    }

    async updateUser(id: string, command: UserUpdateAdminDto): Promise<UserDto> {
        const updatedUser = await this.updateUseCase.execute({
            id: id,
            mode: 'admin',
            detail: {
                status: command.status,
            },
        });
        return toUserDTO(updatedUser);
    }
    async updateProfile(id: string, command: UserUpdateDto): Promise<UserDto> {
        const updatedUser = await this.updateUseCase.execute({
            id: id,
            mode: 'self',
            profile: {
                title: command.title,
                firstName: command.firstName,
                about: command.about,
                middleName: command.middleName,
                lastName: command.lastName,
                dateOfBirth: command.dateOfBirth,
                gender: command.gender,
                picture: command.picture,
                primaryNumber: command.primaryNumber ? new PhoneNumber('',command.primaryNumber.code, command.primaryNumber.number) : undefined,
                secondaryNumber: command.secondaryNumber ? new PhoneNumber('',command.secondaryNumber.code, command.secondaryNumber.number) : undefined,
                isAddressSame: command.isAddressSame,
                isPublicProfile: command.isPublicProfile,
                permanentAddress : command.permanentAddress ? new Address(
                    '',
                    command.permanentAddress.addressLine1,
                    command.permanentAddress.addressLine2,
                    command.permanentAddress.addressLine3,
                    command.permanentAddress.hometown,
                    command.permanentAddress.zipCode,
                    command.permanentAddress.state,
                    command.permanentAddress.district,
                    command.permanentAddress.country
                ) : undefined,
                presentAddress : command.presentAddress ? new Address(
                    '',
                    command.presentAddress.addressLine1,
                    command.presentAddress.addressLine2,
                    command.presentAddress.addressLine3,
                    command.presentAddress.hometown,
                    command.presentAddress.zipCode,
                    command.presentAddress.state,
                    command.presentAddress.district,
                    command.presentAddress.country
                ) : undefined,
                socialMediaLinks: command.socialMediaLinks ? command.socialMediaLinks.map(l => new Link (
                    '',
                    l.platform,
                    l.platformName as LinkType,
                    l.url
                )) : []
            },
        });
        return toUserDTO(updatedUser);

    }

    async assignRole(userId: string, roleCodes: string[]): Promise<void> {
        const roles = roleCodes.map(code => new Role('', code,'',''));
        await this.assignRoleUseCase.execute({
            userId: userId,
            newRoles: roles
        });
    }


}