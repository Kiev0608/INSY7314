'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          is: /^[A-Za-z\s]{3,50}$/
        }
      },
      id_number: {
        type: Sequelize.STRING(13),
        allowNull: false,
        unique: true,
        validate: {
          is: /^\d{13}$/
        }
      },
      account_number: {
        type: Sequelize.STRING(12),
        allowNull: false,
        unique: true,
        validate: {
          is: /^\d{10,12}$/
        }
      },
      username: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-zA-Z0-9_-]{3,30}$/
        }
      },
      password_hash: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      salt: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_changed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      two_factor_secret: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
        validate: {
          is: /^[\+]?[1-9][\d]{0,15}$/
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['id_number'], { unique: true });
    await queryInterface.addIndex('users', ['account_number'], { unique: true });
    await queryInterface.addIndex('users', ['username'], { unique: true });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
