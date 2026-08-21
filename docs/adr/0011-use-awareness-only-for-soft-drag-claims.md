# Use Awareness only for soft drag claims

Active node drags publish a best-effort Drag Claim through Yjs Awareness so other clients normally avoid competing for the same Node. The product does not add a server-authoritative lock protocol; simultaneous claims may race, in which case Yjs still converges the durable position deterministically.
