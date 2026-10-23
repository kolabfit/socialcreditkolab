// Convert DB snake_case user row to camelCase response (tanpa password_hash)
export const mapUser = (user) => {
  if (!user) return user;
  const {
    password_hash,
    lecturer_code,
    advised_startups,
    photo_url,
    rubric_scores,
    presence_stats,
    ...rest
  } = user;

  return {
    ...rest,
    ...(lecturer_code !== undefined && { lecturerCode: lecturer_code }),
    ...(advised_startups !== undefined && { advisedStartups: advised_startups }),
    ...(photo_url !== undefined && { photoUrl: photo_url }),
    ...(rubric_scores !== undefined && { rubricScores: rubric_scores }),
    ...(presence_stats !== undefined && { presenceStats: presence_stats }),
  };
};

export const ROLES = ['intern', 'academic', 'field'];
