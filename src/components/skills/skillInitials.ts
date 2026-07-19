/** 技能名称缩写（skills.html `.skill-logo` / `.dc-logo`） */
export function getSkillInitials(name: string): string {
  const parts = name.split(/[-_\s/]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
