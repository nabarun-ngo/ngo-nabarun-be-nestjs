import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY } from "../../domain/repositories/user.repository.interface";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { CreateUserDto, UserDto, UserFilterDto } from "../dto/user.dto";
import { CreateUserUseCase } from "../use-cases/create-user.use-case";
import { toUserDTO } from "../dto/user-dto.mapper";
import { PagedResult } from "src/shared/models/paged-result";
import { BaseFilter } from "src/shared/models/base-filter-props";
import { UserFilterProps } from "../../domain/model/user.model";


@Injectable()
export class UserService {

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly createUseCase: CreateUserUseCase,
    ) { }

    async list(filterDto:BaseFilter<UserFilterDto>): Promise<PagedResult<UserDto>> {
        const filter : BaseFilter<UserFilterProps> = {
            pageIndex :  filterDto.pageIndex,
            pageSize : filterDto.pageSize,
            props:{
                email:filterDto.props?.email,
                status:filterDto.props?.status,
                firstName:filterDto.props?.firstName,
                lastName: filterDto.props?.lastName,
                roleCode: filterDto.props?.roleCode,
                phoneNumber: filterDto.props?.phoneNumber
            }
        }
        const users = await this.userRepository.findPaged(filter);
        return new PagedResult(users.items.map(toUserDTO), users.total,users.page,users.size);
    }


    async getById(id: string): Promise<UserDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User not found with id ' + id);
        }
        return toUserDTO(user);
    }

    async create(request: CreateUserDto): Promise<UserDto>{
        const newUser = await this.createUseCase.execute(request);
        return toUserDTO(newUser);
    }

}