'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0.01,
          max: 999999999.99
        }
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        validate: {
          isIn: [['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK']]
        }
      },
      provider: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'SWIFT',
        validate: {
          isIn: [['SWIFT', 'FEDWIRE', 'CHIPS']]
        }
      },
      recipient_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          is: /^[A-Za-z\s]{3,50}$/
        }
      },
      recipient_account_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        validate: {
          is: /^[A-Za-z0-9]{8,20}$/
        }
      },
      recipient_bank_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        validate: {
          is: /^[A-Z0-9]{8,11}$/
        }
      },
      swift_code: {
        type: Sequelize.STRING(11),
        allowNull: false,
        validate: {
          is: /^[A-Z]{6}[A-Z0-9]{2,5}$/
        }
      },
      recipient_bank_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          is: /^[A-Za-z\s]{3,100}$/
        }
      },
      recipient_bank_address: {
        type: Sequelize.TEXT,
        allowNull: true,
        validate: {
          len: [0, 500]
        }
      },
      purpose: {
        type: Sequelize.STRING(100),
        allowNull: true,
        validate: {
          is: /^[A-Za-z0-9\s]{0,100}$/
        }
      },
      reference: {
        type: Sequelize.STRING(50),
        allowNull: true,
        validate: {
          is: /^[A-Za-z0-9]{0,50}$/
        }
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'),
        defaultValue: 'PENDING'
      },
      exchange_rate: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true
      },
      fees: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      verification_code: {
        type: Sequelize.STRING(6),
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
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
    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['created_at']);
    await queryInterface.addIndex('transactions', ['swift_code']);
    await queryInterface.addIndex('transactions', ['currency']);
    await queryInterface.addIndex('transactions', ['amount']);
    await queryInterface.addIndex('transactions', ['recipient_name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
};
