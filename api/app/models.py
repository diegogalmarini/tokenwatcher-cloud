# api/app/models.py
# ... (otros modelos User, Watcher, Transport, TokenVolume se mantienen igual) ...

class Event(Base): # Definición TEMPORAL SIMPLIFICADA
    __tablename__ = "events_temp_test" # Usar un nombre temporal para no interferir si 'events' existe de alguna forma
    id = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False)
    # token_address_observed = Column(String(42), nullable=False)
    # from_address = Column(String(42), nullable=False, index=True)
    # to_address = Column(String(42), nullable=False, index=True)   
    amount = Column(Float, nullable=False) # Solo un campo para probar
    transaction_hash = Column(String(66), nullable=False, unique=True) # unique=True temporalmente para simplificar
    # block_number = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)

    # watcher = relationship("Watcher", back_populates="events") # Comentar relación si el modelo Watcher la espera
    # __table_args__ = ( # Comentar table_args por ahora
    #     PrimaryKeyConstraint('id', 'created_at'),
    #     UniqueConstraint('transaction_hash', 'created_at', 'from_address', 'to_address', 'amount', name='uq_events_unique_event_fields'),
    #     {
    #         'postgresql_partition_by': 'RANGE (created_at)'
    #     }
    # )