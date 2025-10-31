import { UserStatus } from '../model/user.model';
import { BaseFilterProps } from '../../../../shared/domain/base-filter-props';
import { ValueObject } from '../../../../shared/domain/value-object';

class UserFilterProps extends BaseFilterProps {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly status?: UserStatus;
}

export class UserFilter extends ValueObject<UserFilterProps> {
  constructor(props: UserFilterProps) {
    super(props);
  }
}
