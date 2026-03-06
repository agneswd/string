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
    Category,
    Text,
    Voice,
    Announcement,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub struct ChannelLayoutItem {
    pub channel_id: u64,
    pub category_id: Option<u64>,
    pub position: u32,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum RtcSignalType {
    Offer,
    Answer,
    IceCandidate,
    Bye,
}
