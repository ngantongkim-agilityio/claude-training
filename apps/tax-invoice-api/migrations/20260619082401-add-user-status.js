module.exports = {
  /**
   * Backfill all existing users without a status field, setting them to 'active'.
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    await db
      .collection('users')
      .updateMany({ status: { $exists: false } }, { $set: { status: 'active' } })
  },

  /**
   * Remove the status field from all users.
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    await db.collection('users').updateMany({}, { $unset: { status: '' } })
  },
}
