import { Actor } from 'dacha';

import Team from '../../../components/team/team.component';

export const findTeam = (actor: Actor): Team | null => {
  const team = actor.getComponent(Team);

  if (team !== undefined) {
    return team;
  }

  if (actor.parent === null || !(actor.parent instanceof Actor)) {
    return null;
  }

  return findTeam(actor.parent);
};
