module.exports = {
  name: '20260914_001_studio_availability',
  async up({ queryInterface, Sequelize }) {
    const settings = await queryInterface.describeTable('studio_settings');
    if (!settings.slot_interval_minutes) {
      await queryInterface.addColumn('studio_settings', 'slot_interval_minutes', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60,
      });
    }

    const appointmentIndexes = await queryInterface.showIndex('appointments');
    const hasDateTimeStatus = appointmentIndexes.some((index) => index.name === 'idx_appointments_date_time_status');
    if (!hasDateTimeStatus) {
      await queryInterface.addIndex('appointments', ['date', 'time', 'status'], {
        name: 'idx_appointments_date_time_status',
      });
    }

    const paymentIndexes = await queryInterface.showIndex('payments');
    const hasReferenceIndex = paymentIndexes.some((index) => index.name === 'idx_payments_reference');
    if (!hasReferenceIndex) {
      await queryInterface.addIndex('payments', ['reference_number'], {
        name: 'idx_payments_reference',
      });
    }
  },
};
