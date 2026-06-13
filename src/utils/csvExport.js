/**
 * Export leaderboard standings as a downloadable CSV file.
 */
export function exportStandingsToCSV(standings) {
  const header = 'Rank,Player,Total Points,Scored Matches';
  const rows = standings.map(
    (entry, index) =>
      `${index + 1},"${entry.name.replace(/"/g, '""')}",${entry.totalPoints},${entry.scoredMatches}`,
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `fagama-polla-standings-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
