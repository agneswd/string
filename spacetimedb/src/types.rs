use spacetimedb::SpacetimeType;

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum UserStatus {
    Online,
    Away,
    DoNotDisturb,
    Offline,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, PartialOrd)]
pub enum MemberRole {
    Member,
    Moderator,
    Admin,
    Owner,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum ChannelType {
    Text,
    Voice,
    Announcement,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum RtcSignalType {
    Offer,
    Answer,
    IceCandidate,
    Bye,
}
