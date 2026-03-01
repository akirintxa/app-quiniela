
// app/components/RankingTable.tsx

/**
 * Renders a real-time ranking table for a pool or global ranking.
 *
 * This component would need to:
 * 1. Fetch the predictions and results for all users in the pool.
 * 2. Calculate the total points for each user.
 * 3. Sort the users by points in descending order.
 * 4. Display the ranking with user names and their total points.
 * 5. Use real-time features from Supabase (or polling) to update the table as new results come in.
 * 6. Once a match is locked, show the predictions of other users.
 */
export default function RankingTable() {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Ranking</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">#</th>
            <th className="text-left">User</th>
            <th className="text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Player 1</td>
            <td className="text-right">120</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Player 2</td>
            <td className="text-right">115</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Player 3</td>
            <td className="text-right">110</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
