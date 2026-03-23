import 'dotenv/config'
import { sequelize } from '../config/database'

async function main() {
  const [result] = await sequelize.query(
    'UPDATE auctions SET end_time = DATE_ADD(start_time, INTERVAL 15 DAY) WHERE status IN (0, 1)'
  )
  console.log('sync_auction_duration_done')
  console.log(result)
  await sequelize.close()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await sequelize.close()
  } catch {}
  process.exit(1)
})
