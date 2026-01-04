import { User } from "src/modules/user/domain/model/user.model";
import { TeamMember } from "./public.dto";
import { LinkType } from "src/modules/user/domain/model/link.model";

export function toTeamMemberDTO(user: User): TeamMember {
  return {
    id: user.id,
    fullName: user.fullName!,
    picture: user.picture!,
    roleString: user.roles.map(r => r.roleName).join(', '),
    email: user.email,
    socialLinks: {
      facebook: user.socialMediaLinks.find(l => l.linkType === LinkType.FACEBOOK)?.linkValue,
      twitter: user.socialMediaLinks.find(l => l.linkType === LinkType.TWITTER)?.linkValue,
      linkedin: user.socialMediaLinks.find(l => l.linkType === LinkType.LINKEDIN)?.linkValue,
      instagram: user.socialMediaLinks.find(l => l.linkType === LinkType.INSTAGRAM)?.linkValue,
    }
  }
}

export function dtoToRecord<T extends object>(dto: T): Record<string, string> {
  return Object.entries(dto).reduce((acc, [key, value]) => {
    acc[key] = String(value); // force everything to string
    return acc;
  }, {} as Record<string, string>);
}
